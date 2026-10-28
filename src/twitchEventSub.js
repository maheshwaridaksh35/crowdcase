const HELIX = "https://api.twitch.tv/helix";
const EVENTSUB_WS = "wss://eventsub.wss.twitch.tv/ws";

async function helixGet(path, clientId, accessToken) {
  const response = await fetch(HELIX + path, {
    headers: {
      "Client-Id": clientId,
      Authorization: "Bearer " + accessToken,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error("Twitch API request failed (" + response.status + "): " + body.slice(0, 180));
  }
  return response.json();
}

async function validateAccessToken(clientId, accessToken) {
  const response = await fetch("https://id.twitch.tv/oauth2/validate", {
    headers: { Authorization: "OAuth " + accessToken },
  });
  if (!response.ok) throw new Error("Twitch authorization expired or was rejected. Disconnect and reconnect.");
  const token = await response.json();
  if (token.client_id !== clientId) {
    throw new Error("This access token belongs to a different Twitch Client ID. Reconnect with the configured application.");
  }
  if (!Array.isArray(token.scopes) || !token.scopes.includes("user:read:chat")) {
    throw new Error("The granted token is missing user:read:chat. Reconnect and approve the requested chat permission.");
  }
  if (!token.user_id) throw new Error("Twitch did not return the authorized user's ID.");
  return token;
}

export async function startTwitchChat({ clientId, accessToken, channelLogin, onMessage, onStatus, onError }) {
  let stopped = false;
  let currentSocket = null;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let broadcasterId = null;
  let authorizedUserId = null;
  const supersededSockets = new WeakSet();
  const seenMessageIds = new Set();

  const status = (value) => { if (!stopped) onStatus?.(value); };
  const error = (value) => { if (!stopped) onError?.(value); };

  try {
    status("Validating Twitch authorization…");
    const identity = await validateAccessToken(clientId.trim(), accessToken);
    authorizedUserId = identity.user_id;
    const channelResponse = await helixGet("/users?login=" + encodeURIComponent(channelLogin.trim()), clientId.trim(), accessToken);
    const broadcaster = channelResponse.data?.[0];
    if (!broadcaster?.id) throw new Error("Twitch channel not found. Check the channel login in Settings.");
    if (broadcaster.id !== authorizedUserId) {
      throw new Error("For this MVP, authorize the Twitch account that owns the channel you enter. Reading a different channel needs a separate broadcaster-approved bot authorization flow.");
    }
    broadcasterId = broadcaster.id;

    if (stopped) return () => {};
  } catch (err) {
    error(err instanceof Error ? err.message : "Could not validate Twitch connection.");
    return () => { stopped = true; };
  }

  async function subscribe(sessionId) {
    const response = await fetch(HELIX + "/eventsub/subscriptions", {
      method: "POST",
      headers: {
        "Client-Id": clientId.trim(),
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "channel.chat.message",
        version: "1",
        condition: { broadcaster_user_id: broadcasterId, user_id: authorizedUserId },
        transport: { method: "websocket", session_id: sessionId },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error("Could not subscribe to Twitch chat (" + response.status + "): " + body.slice(0, 220));
    }
    status("Connected to @" + channelLogin + " — receiving real Twitch chat");
  }

  function scheduleReconnect() {
    if (stopped || reconnectTimer !== null) return;
    reconnectAttempts += 1;
    const delay = Math.min(30000, 1000 * (2 ** Math.min(reconnectAttempts - 1, 5)));
    status("Chat connection lost; retrying in " + Math.ceil(delay / 1000) + "s…");
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      openSocket(EVENTSUB_WS, false, null);
    }, delay);
  }

  function openSocket(url = EVENTSUB_WS, isMigration = false, oldSocket = null) {
    if (stopped) return;
    let socket;
    try {
      socket = new WebSocket(url);
    } catch {
      scheduleReconnect();
      return;
    }
    currentSocket = socket;
    status(isMigration ? "Migrating Twitch chat connection…" : "Opening Twitch EventSub WebSocket…");

    socket.onmessage = async (messageEvent) => {
      let envelope;
      try {
        envelope = JSON.parse(messageEvent.data);
      } catch {
        return;
      }

      const messageType = envelope.metadata?.message_type;
      if (messageType === "session_welcome") {
        reconnectAttempts = 0;
        if (isMigration) {
          if (oldSocket && oldSocket.readyState < WebSocket.CLOSING) {
            supersededSockets.add(oldSocket);
            oldSocket.close(1000, "EventSub session migrated");
          }
          status("Twitch chat reconnected");
        } else {
          const sessionId = envelope.payload?.session?.id;
          if (!sessionId) {
            error("Twitch opened a session without a session ID.");
            return;
          }
          try {
            await subscribe(sessionId);
          } catch (err) {
            error(err instanceof Error ? err.message : "Could not subscribe to Twitch chat.");
            try { socket.close(1000, "Subscription failed"); } catch (closeError) { error(closeError instanceof Error ? closeError.message : "Could not close failed Twitch socket."); }
          }
        }
        return;
      }

      if (messageType === "session_reconnect") {
        const reconnectUrl = envelope.payload?.session?.reconnect_url;
        if (reconnectUrl) openSocket(reconnectUrl, true, socket);
        return;
      }

      if (messageType === "revocation") {
        const reason = envelope.payload?.subscription?.status || "unknown";
        error("Twitch revoked the chat subscription (" + reason + "). Reconnect and check the channel permissions.");
        return;
      }

      if (messageType !== "notification") return;
      const subType = envelope.payload?.subscription?.type;
      if (subType !== "channel.chat.message") return;
      const event = envelope.payload?.event;
      if (!event?.message?.text || !event?.chatter_user_name) return;

      const messageId = event.message_id || envelope.metadata?.message_id;
      if (messageId && seenMessageIds.has(messageId)) return;
      if (messageId) {
        seenMessageIds.add(messageId);
        if (seenMessageIds.size > 1500) {
          const first = seenMessageIds.values().next().value;
          if (first) seenMessageIds.delete(first);
        }
      }

      onMessage?.({
        id: messageId || ("twitch-" + Date.now() + "-" + Math.random().toString(16).slice(2)),
        userName: event.chatter_user_name,
        text: event.message.text,
        timestamp: event.message_timestamp || new Date().toISOString(),
        color: colorForUser(event.chatter_user_name),
        source: "twitch",
      });
    };

    socket.onerror = () => {
      status("Twitch WebSocket error; checking connection…");
    };

    socket.onclose = () => {
      if (stopped || supersededSockets.has(socket)) return;
      if (currentSocket === socket) currentSocket = null;
      scheduleReconnect();
    };
  }

  status("Connecting to Twitch chat…");
  openSocket();

  return () => {
    if (stopped) return;
    stopped = true;
    if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
    if (currentSocket && currentSocket.readyState < WebSocket.CLOSING) {
      try { currentSocket.close(1000, "CrowdCase disconnected"); } catch (closeError) { error(closeError instanceof Error ? closeError.message : "Could not close Twitch socket."); }
    }
    currentSocket = null;
  };
}

function colorForUser(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i += 1) hash = ((hash << 5) - hash + username.charCodeAt(i)) | 0;
  const palette = ["#a99bff", "#81dacc", "#ffc47c", "#f09fbb", "#87baff", "#c6d58b"];
  return palette[Math.abs(hash) % palette.length];
}
