import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { startTwitchChat } from "../twitchEventSub";
import { analyzeChatTheories } from "../lib/ai-theories";
import { findSimilarTheory, parseChatCommand } from "../lib/theory-engine";
import { validateChatVote } from "../lib/vote-engine";
import { rememberEventId } from "../lib/message-idempotency";
import { guardLeadingTheory } from "../lib/ai-validation.js";
import "./twitch-connect.css";
import "./ai-analysis.css";
import { Activity, AlertCircle, ArrowDownRight, ArrowUpRight, AudioLines, BarChart3, Bell, BookOpen, BrainCircuit, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, Copy, Crown, Eye, Fingerprint, Lightbulb, Link2, LockKeyhole, MessageCircle, MessageSquare, MousePointer2, Play, Plus, Radio, RefreshCw, Send, Settings2, Shield, Sparkles, Target, Vote, X } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "CrowdCase — The chat is the detective" }, { name: "description", content: "Turn Twitch chat into a collaborative live investigation." }] }),
  component: CrowdCaseApp,
});

const initialMessages = [
  { id: 1, name: "lunarbyte", color: "#9f8cff", time: "9:17:03", text: "wait — the clock stopped at 9:17?? that's too specific to be random", kind: "chat" },
  { id: 2, name: "moss.exe", color: "#63d9c4", time: "9:17:08", text: "the curator has access to every room, just saying 👀", kind: "chat" },
  { id: 3, name: "pixelpilgrim", color: "#ffbf70", time: "9:17:14", text: "BLUE FIBER ON THE LATCH. someone had a blue coat?", kind: "chat" },
  { id: 4, name: "orbitalsoup", color: "#ec8aab", time: "9:17:21", text: "!theory curator used the blackout to unlock the case", kind: "theory" },
  { id: 5, name: "nocturne_tv", color: "#81b6ff", time: "9:17:26", text: "chat is cooking. check the window sill for a forced entry", kind: "chat" },
];
const originalTheories = [
  { id: "curator", title: "The curator used the blackout to unlock the case", by: "orbitalsoup", votes: 42, tag: "ACCESS", color: "violet" },
  { id: "window", title: "The thief entered through the gallery window", by: "lunarbyte", votes: 28, tag: "ENTRY", color: "cyan" },
  { id: "guard", title: "The night guard staged the blackout", by: "moss.exe", votes: 17, tag: "TIMING", color: "amber" },
];
const suspects = [
  { name: "Evelyn Vale", role: "The Curator", initials: "EV", color: "#b5a2ff", detail: "Held the only master key. Claims she was in the west archive.", clue: "Access to the display case", badge: "HIGH ACCESS" },
  { name: "Jonah Reed", role: "Night Guard", initials: "JR", color: "#75d5ca", detail: "Logged the blackout at 9:16 PM. His patrol route has a gap.", clue: "A 47-second patrol gap", badge: "TIMING" },
  { name: "Mira Sol", role: "Restoration Artist", initials: "MS", color: "#ffbf70", detail: "Works with blue silk cloth and fine clockwork tools.", clue: "Blue fibers in her studio", badge: "MATERIALS" },
  { name: "Theo Ash", role: "Guest Collector", initials: "TA", color: "#ff93b6", detail: "Insured a similar piece last year. Says he left before closing.", clue: "A disputed alibi", badge: "MOTIVE" },
];
const initialClues = [
  { id: 1, number: "CLUE 01", title: "Silver dust on the window sill", body: "The dust is undisturbed, suggesting the window was not used as an entry point.", type: "FORENSICS", status: "REVEALED", icon: "fingerprint" },
  { id: 2, number: "CLUE 02", title: "The gallery clock stopped at 9:17", body: "The mechanism was deliberately halted. The blackout began at 9:16 PM.", type: "TIMELINE", status: "REVEALED", icon: "clock" },
  { id: 3, number: "CLUE 03", title: "A faint blue fiber on the latch", body: "A single thread is caught where the display case locks.", type: "TRACE EVIDENCE", status: "NEW", icon: "fiber" },
];
const codexBrief = "CrowdCase for the Codex x TwitchCon Hackathon. Continue the existing codebase and make the core experience real, testable, and safe. Requirements: newly created interactive Twitch experience, built using OpenAI Codex, connected to Twitch via supported chat/EventSub/API/overlay, submission needs repository, project description, public YouTube demo under 3 minutes and actual Codex session ID. Do not claim this prototype is already connected to Twitch. First inspect architecture and give a short plan, then implement and run tests/build. Implement current Twitch-approved chat connectivity using current docs, OAuth with server-side token storage, configurable channel, reconnect/backoff, duplicate-event handling and rate limits. Do not expose secrets in browser code. Normalize chat messages and parse commands !theory, !vote, !clue. Make AI theory grouping server-side with structured output traceable to source-message IDs and deterministic fallback. Add anonymous browser-source overlay at /overlay. Add unit tests for command parsing, deduplication, voting, reconnect and token safety. Add .env.example, README setup, deployment guide and real demo steps. Most of the actual implementation must happen in Codex; capture the real session ID using /status in that Codex thread. Never invent a session ID.";

function ClockText({ children }) { return <span className="mono">{children}</span>; }

function CrowdCaseApp() {
  const [activeView, setActiveView] = useState("Live Case");
  const [messages, setMessages] = useState(initialMessages);
  const [theories, setTheories] = useState(originalTheories);
  const [clues, setClues] = useState(initialClues);
  const [messageInput, setMessageInput] = useState("");
  const [voteActive, setVoteActive] = useState(true);
  const [chapter, setChapter] = useState(2);
  const [toast, setToast] = useState("");
  const [selectedTheory, setSelectedTheory] = useState("curator");
  const [voteCount, setVoteCount] = useState(87);
  const [replaying, setReplaying] = useState(false);
  const [channel, setChannel] = useState("nocturne_tv");
  const [twitchClientId, setTwitchClientId] = useState("");
  const [twitchAccessToken, setTwitchAccessToken] = useState("");
  const [twitchStatus, setTwitchStatus] = useState("Not connected");
  const [twitchError, setTwitchError] = useState("");
  const [showConnection, setShowConnection] = useState(false);
  const [showAllClues, setShowAllClues] = useState(false);
  const [demoVersion, setDemoVersion] = useState(0);
  const [copied, setCopied] = useState(false);
  const replayRef = useRef(null);
  const realChatInitializedRef = useRef(false);
  const votedChatUsersRef = useRef(new Set());
  const processedMessageIdsRef = useRef(new Set());
  const twitchDisconnectRef = useRef(null);
  const messageCallbacksRef = useRef({});

  useEffect(() => () => { if (replayRef.current) clearInterval(replayRef.current); }, []);
  useEffect(() => { if (voteActive) votedChatUsersRef.current.clear(); }, [voteActive]);

  useEffect(() => {
    const savedClientId = window.localStorage.getItem("crowdcase-twitch-client-id") || "";
    const savedChannel = window.localStorage.getItem("crowdcase-twitch-channel") || "";
    if (savedClientId) setTwitchClientId(savedClientId);
    if (savedChannel) setChannel(savedChannel);

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const queryParams = new URLSearchParams(window.location.search);
    const returnedToken = params.get("access_token");
    const oauthError = params.get("error") || queryParams.get("error");
    const returnedState = params.get("state") || queryParams.get("state");
    if (returnedToken || oauthError) {
      const expectedState = window.sessionStorage.getItem("crowdcase-twitch-oauth-state");
      window.sessionStorage.removeItem("crowdcase-twitch-oauth-state");
      if (expectedState && returnedState === expectedState && returnedToken) {
        setTwitchAccessToken(returnedToken);
        setTwitchStatus("Authorization accepted — connecting to chat…");
        setTwitchError("");
      } else if (expectedState && returnedState === expectedState && oauthError) {
        setTwitchStatus("Authorization not completed");
        setTwitchError(queryParams.get("error_description") || params.get("error_description") || "Twitch authorization was cancelled.");
      } else {
        setTwitchStatus("Authorization failed");
        setTwitchError("OAuth state is missing or did not match. Try the connection flow again.");
      }
      window.history.replaceState(null, document.title, window.location.pathname);
    }
  }, []);
  const showToast = (text) => { setToast(text); window.setTimeout(() => setToast(""), 2500); };
  const upsertTheory = (text, author) => {
    const clean = text.replace(/^!theory\s*/i, "").trim();
    if (clean.length < 8) return;
    const found = findSimilarTheory(theories, clean);
    if (found) {
      setTheories((prev) => prev.map((t) => t.id === found.id ? { ...t, by: author + " + community" } : t));
    } else {
      const id = "theory-" + Date.now();
      setTheories((prev) => [{ id, title: clean, by: author, votes: 0, tag: "CHAT THEORY", color: "violet" }, ...prev]);
      setSelectedTheory(id);
    }
  };

  const addMessage = (rawText, userName = "you", color = "#a78bfa", meta = null) => {
    const text = rawText.trim();
    if (!text) return;
    if (meta?.id && !rememberEventId(meta.id, processedMessageIdsRef.current)) return;
    const parsedTimestamp = meta?.timestamp ? new Date(meta.timestamp) : new Date();
    const safeTimestamp = Number.isNaN(parsedTimestamp.getTime()) ? new Date() : parsedTimestamp;
    const time = safeTimestamp.toLocaleTimeString("en-GB", { hour12: false, timeZone: "Asia/Singapore" });
    const parsedCommand = parseChatCommand(text);
    const kind = parsedCommand.type;
    setMessages((prev) => {
      if (meta?.id && prev.some((message) => message.id === meta.id)) return prev;
      return [...prev.slice(-34), { id: meta?.id || Date.now() + Math.random(), name: userName, color, time, text, kind, source: meta?.source || "simulated" }];
    });
    if (kind === "theory") {
      if (parsedCommand.argument.length < 8) { showToast("Add a theory after !theory (at least 8 characters)"); return; }
      upsertTheory(text, userName);
      showToast("Theory added to community intelligence");
    }
    else if (kind === "vote") {
      const vote = validateChatVote({
        votingOpen: voteActive,
        username: userName,
        term: parsedCommand.argument,
        theories,
        votedUsernames: votedChatUsersRef.current,
      });
      if (vote.status === "closed") { showToast("Voting is closed — wait for the streamer to open a vote"); return; }
      if (vote.status === "already-voted") { showToast("This viewer has already voted in the current round"); return; }
      if (vote.status === "invalid") { showToast("Vote not matched — use !vote followed by a theory or suspect name"); return; }
      votedChatUsersRef.current.add(vote.username);
      setTheories((prev) => prev.map((t) => t.id === vote.theoryId ? { ...t, votes: t.votes + 1 } : t));
      setVoteCount((v) => v + 1);
      showToast("Vote counted for " + vote.title.slice(0, 30));
    } else if (kind === "clue") {
      revealClue();
    }
  };

  const revealClue = () => {
    if (clues.some((c) => c.id === 4)) { showToast("All available demo clues are revealed"); return; }
    setClues((prev) => [...prev, { id: 4, number: "CLUE 04", title: "A tiny gear tooth in the velvet seam", body: "A fragment of brass clockwork is caught inside the display case lining. Whoever opened it knew the mechanism.", type: "MECHANICAL TRACE", status: "JUST REVEALED", icon: "gear" }]);
    const time = new Date().toLocaleTimeString("en-GB", { hour12: false, timeZone: "Asia/Singapore" });
    setMessages((prev) => [...prev.slice(-34), { id: Date.now(), name: "CASE SYSTEM", color: "#8fe5d2", time, text: "New evidence revealed: a tiny gear tooth was found in the velvet seam.", kind: "system" }]);
    showToast("Clue revealed — the case board has been updated");
  };

  messageCallbacksRef.current = { addMessage, showToast };

  useEffect(() => {
    if (!twitchAccessToken || !twitchClientId.trim() || !channel.trim()) return undefined;
    let cancelled = false;
    let stopConnection = () => {};
    setTwitchStatus("Connecting to Twitch chat…");
    setTwitchError("");

    startTwitchChat({
      clientId: twitchClientId,
      accessToken: twitchAccessToken,
      channelLogin: channel,
      onStatus: (status) => {
        if (cancelled) return;
        setTwitchStatus(status);
        if (status.startsWith("Connected to @") && !realChatInitializedRef.current) {
          realChatInitializedRef.current = true;
          setMessages((prev) => prev.filter((message) => message.source === "twitch"));
          setTheories([]);
          setVoteCount(0);
          votedChatUsersRef.current.clear();
        }
      },
      onError: (errorMessage) => {
        if (cancelled) return;
        setTwitchError(errorMessage);
        setTwitchStatus("Connection error");
      },
      onMessage: (message) => {
        if (cancelled) return;
        messageCallbacksRef.current.addMessage(message.text, message.userName, message.color, {
          id: message.id,
          timestamp: message.timestamp,
          source: "twitch",
        });
      },
    }).then((disconnect) => {
      if (cancelled) disconnect();
      else {
        stopConnection = disconnect;
        twitchDisconnectRef.current = disconnect;
      }
    }).catch((error) => {
      if (!cancelled) {
        setTwitchError(error instanceof Error ? error.message : "Could not connect to Twitch.");
        setTwitchStatus("Connection error");
      }
    });

    return () => {
      cancelled = true;
      stopConnection();
      if (twitchDisconnectRef.current === stopConnection) twitchDisconnectRef.current = null;
    };
  }, [twitchAccessToken, twitchClientId, channel]);

  const replayChat = () => {
    if (twitchStatus.startsWith("Connected to @") || twitchStatus === "Twitch chat reconnected") { showToast("Disconnect Twitch before replaying simulated chat"); return; }
    if (replaying) { if (replayRef.current) clearInterval(replayRef.current); replayRef.current = null; setReplaying(false); showToast("Chat replay paused"); return; }
    setReplaying(true);
    const scripted = [
      ["tinycircuit", "!theory the curator had a spare key and stopped the clock", "#87c8ff"],
      ["moss.exe", "silver dust is untouched — window theory is weak", "#68ddc9"],
      ["lunarbyte", "!vote curator", "#b3a0ff"],
      ["teacupchaos", "what if the blue fiber belongs to Mira's restoration cloth?", "#ffbf70"],
      ["pixelpilgrim", "!theory Mira distracted the guard while the curator opened the case", "#f19ab8"],
    ];
    let index = 0;
    replayRef.current = window.setInterval(() => {
      if (index >= scripted.length) { clearInterval(replayRef.current); replayRef.current = null; setReplaying(false); showToast("Audience test complete — sample messages replayed"); return; }
      const item = scripted[index++]; addMessage(item[1], item[0], item[2]);
    }, 950);
  };

  const resetDemo = () => {
    const liveConnection = twitchStatus.startsWith("Connected to @") || twitchStatus === "Twitch chat reconnected";
    votedChatUsersRef.current.clear();
    if (replayRef.current) clearInterval(replayRef.current);
    replayRef.current = null;
    setMessages(liveConnection ? messages.filter((message) => message.source === "twitch") : initialMessages);
    setTheories(liveConnection ? [] : originalTheories);
    setClues(initialClues);
    setVoteActive(true); setChapter(2); setSelectedTheory(liveConnection ? "" : "curator"); setVoteCount(liveConnection ? 0 : 87); setReplaying(false); setDemoVersion((v) => v + 1);
    showToast(liveConnection ? "Local case reset; live Twitch chat remains intact" : "Demo reset to its starting state");
  };

  const copyCodexBrief = async () => {
    try { await navigator.clipboard.writeText(codexBrief); setCopied(true); showToast("Codex integration brief copied"); window.setTimeout(() => setCopied(false), 1800); }
    catch { showToast("Clipboard is unavailable. Open the editor to copy the brief."); }
  };

  const startTwitchOAuth = () => {
    const clientId = twitchClientId.trim();
    const channelLogin = channel.trim().replace(/^@/, "");
    if (!clientId) {
      setTwitchError("Enter your public Twitch Client ID first.");
      showToast("Add the public Client ID to connect Twitch");
      setShowConnection(true);
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(clientId)) {
      setTwitchError("That Client ID format looks invalid. Copy the Client ID from your Twitch developer application.");
      setShowConnection(true);
      return;
    }
    if (!channelLogin) {
      setTwitchError("Enter a Twitch channel login first.");
      setShowConnection(true);
      return;
    }
    const state = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : Array.from(window.crypto.getRandomValues(new Uint8Array(24)), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const redirectUri = window.location.origin + "/";
    window.localStorage.setItem("crowdcase-twitch-client-id", clientId);
    window.localStorage.setItem("crowdcase-twitch-channel", channelLogin);
    window.sessionStorage.setItem("crowdcase-twitch-oauth-state", state);
    const parameters = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "token",
      scope: "user:read:chat",
      state,
    });
    window.location.assign("https://id.twitch.tv/oauth2/authorize?" + parameters.toString());
  };

  const disconnectTwitch = () => {
    if (twitchDisconnectRef.current) twitchDisconnectRef.current();
    twitchDisconnectRef.current = null;
    setTwitchAccessToken("");
    setTwitchStatus("Not connected");
    setTwitchError("");
    showToast("Twitch chat disconnected");
  };

  const isTwitchConnected = twitchStatus.startsWith("Connected to @") || twitchStatus === "Twitch chat reconnected";
  const currentLeader = useMemo(() => [...theories].sort((a, b) => b.votes - a.votes)[0], [theories]);
  const visibleClues = showAllClues || clues.some((c) => c.id === 4) ? clues : clues.slice(0, 3);

  useEffect(() => {
    const snapshot = { chapter, voteActive, voteCount, clues, theories, messages, isTwitchConnected };
    try {
      window.localStorage.setItem("crowdcase-overlay-state", JSON.stringify(snapshot));
    } catch {
      // The current dashboard stays functional even if browser storage is disabled.
    }
    if (typeof BroadcastChannel !== "undefined") {
      const sync = new BroadcastChannel("crowdcase-live");
      sync.postMessage(snapshot);
      sync.close();
    }
  }, [chapter, voteActive, voteCount, clues, theories, messages]);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-row"><div className="brand-mark"><Fingerprint size={22}/></div><div className="brand-lockup"><span>CrowdCase</span><small>CREATOR TOOLS</small></div></div>
      <div className="workspace-switcher"><div className="workspace-avatar">N</div><div className="workspace-text"><strong>{channel}</strong><span>Creator workspace</span></div><ChevronDown size={15} className="muted-icon"/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">
        {[{label:"Live Case",icon:Radio},{label:"Case Library",icon:BookOpen},{label:"Insights",icon:BarChart3},{label:"Settings",icon:Settings2}].map(({label,icon:Icon})=><button key={label} className={"nav-item "+(activeView===label?"active":"")} onClick={()=>setActiveView(label)}><Icon size={17}/><span>{label}</span>{label==="Live Case"&&<span className="live-nav-dot"/>}</button>)}
      </nav>
      <div className="sidebar-case"><div className="case-thumb"><Eye size={23}/></div><div className="case-thumb-copy"><div className="eyebrow">CURRENT CASE</div><strong>The Midnight Gallery Heist</strong><span>Chapter {chapter} of 4</span></div><div className="case-progress"><span style={{width:(chapter/4*100)+"%"}}/></div></div>
      <div className="sidebar-bottom"><div className="upgrade-mini"><div className="upgrade-icon"><Sparkles size={16}/></div><div><strong>Make chat matter.</strong><p>Turn every viewer into a co-detective.</p></div></div><button className="user-row" onClick={()=>showToast("Creator profile settings are in the Settings tab")}><div className="user-avatar">D</div><div className="user-detail"><strong>Creator studio</strong><span>Free workspace</span></div></button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14}/><strong>{activeView}</strong></div><div className="topbar-right"><div className="demo-pill"><span className={"demo-dot "+(isTwitchConnected?"connected":"")}/> {isTwitchConnected?"DEMO CASE":"DEMO MODE"} <span className="demo-pill-divider"/> {isTwitchConnected?"LIVE TWITCH CHAT":"SIMULATED CHAT"}</div><button className="icon-button" aria-label="Notifications" onClick={()=>showToast("You're all caught up")}><Bell size={17}/></button><button className="help-button" onClick={()=>showToast("Reveal clues, test chat and vote with the demo controls.")}><CircleHelp size={17}/> Help</button></div></header>
      <section className="page-content">
        {activeView==="Live Case"&&<LiveCaseView channel={channel} isTwitchConnected={isTwitchConnected} resetVersion={demoVersion} messages={messages} theories={theories} setTheories={setTheories} clues={clues} input={messageInput} setInput={setMessageInput} addMessage={addMessage} voteActive={voteActive} setVoteActive={setVoteActive} revealClue={revealClue} chapter={chapter} setChapter={setChapter} showToast={showToast} replayChat={replayChat} replaying={replaying} resetDemo={resetDemo} selectedTheory={selectedTheory} setSelectedTheory={setSelectedTheory} voteCount={voteCount} setVoteCount={setVoteCount} visibleClues={visibleClues} showAllClues={showAllClues} setShowAllClues={setShowAllClues} currentLeader={currentLeader} showConnection={()=>setShowConnection(true)}/>}
        {activeView==="Case Library"&&<CaseLibrary onStart={()=>{setActiveView("Live Case");showToast("Midnight Gallery Heist is already loaded");}}/>}
        {activeView==="Insights"&&<Insights messages={messages} theories={theories} voteCount={voteCount} clues={clues} isTwitchConnected={isTwitchConnected}/>}
        {activeView==="Settings"&&<SettingsPanel channel={channel} setChannel={setChannel} twitchClientId={twitchClientId} setTwitchClientId={setTwitchClientId} twitchStatus={twitchStatus} twitchError={twitchError} isTwitchConnected={isTwitchConnected} onTwitchConnect={startTwitchOAuth} onTwitchDisconnect={disconnectTwitch} onConnect={()=>setShowConnection(true)} showToast={showToast}/>}
      </section>
      <footer className="footer-line"><span><Shield size={13}/> CrowdCase protects the fun, not your secrets.</span><span>Prototype v0.1 <b>·</b> Built for live communities</span></footer>
    </main>
    {showConnection&&<div className="modal-scrim" role="presentation" onMouseDown={(e)=>{if(e.target===e.currentTarget)setShowConnection(false);}}><section className="connection-modal" role="dialog" aria-modal="true" aria-labelledby="connection-title">
      <div className="modal-header"><div className="modal-heading-icon"><Link2 size={19}/></div><div><div className="eyebrow">INTEGRATION SETUP</div><h2 id="connection-title">Connect CrowdCase to Twitch</h2></div><button className="icon-button" onClick={()=>setShowConnection(false)} aria-label="Close"><X size={17}/></button></div>
      <p className="modal-lede">Authorize Twitch chat for the selected channel. This browser prototype uses Twitch's implicit OAuth flow: enter only the public Client ID, never a Client Secret. Until connected, seeded messages remain simulated.</p>
      <div className="settings-card twitch-connect-card">
        <label className="field-label" htmlFor="twitch-client-id">Public Twitch Client ID</label>
        <input id="twitch-client-id" className="twitch-client-input" autoComplete="off" spellCheck={false} placeholder="Paste Client ID from Twitch developer app" value={twitchClientId} onChange={(e) => setTwitchClientId(e.target.value.trim())} />
        <label className="field-label" htmlFor="twitch-channel-login">Twitch channel login</label>
        <div className="input-with-prefix"><span>@</span><input id="twitch-channel-login" value={channel} onChange={(e) => setChannel(e.target.value.toLowerCase().replace(/^@/, "").replace(/[^a-z0-9_]/g, ""))} maxLength={25} /></div>
        <div className="redirect-row"><span>Required OAuth redirect URI</span><code>{typeof window !== "undefined" ? window.location.origin + "/" : "https://your-app.example/"}</code><button className="text-action" onClick={() => { navigator.clipboard?.writeText(window.location.origin + "/"); showToast("Redirect URI copied"); }}><Copy size={12}/> Copy</button></div>
        <div className="twitch-status-row"><span className={"status-dot "+(isTwitchConnected?"status-connected":"")}/><div><strong>{twitchStatus}</strong><p>{twitchError || (isTwitchConnected ? "Incoming Twitch chat events should appear in the feed." : "Register this exact redirect URI in the Twitch Developer Console first.")}</p></div></div>
        <div className="twitch-actions">{isTwitchConnected ? <button className="secondary-button" onClick={disconnectTwitch}><X size={14}/> Disconnect Twitch</button> : <button className="primary-button" onClick={startTwitchOAuth}><Link2 size={14}/> Authorize Twitch chat</button>}</div>
        <div className="connection-note"><LockKeyhole size={13}/> The access token remains in memory and is removed from the URL after OAuth state validation. Do not provide any Client Secret.</div>
      </div>
      <div className="connection-steps">
        <div className="connection-step"><span className="step-number">01</span><div><strong>Create a Twitch developer application</strong><p>Register an application and add the exact redirect URI shown in the connection form.</p><a href="https://dev.twitch.tv/console/apps" target="_blank" rel="noreferrer">Open Twitch Developer Console <ChevronRight size={13}/></a></div><span className="step-status status-needed">NEEDED</span></div>
        <div className="connection-step"><span className="step-number">02</span><div><strong>Authorize chat and verify events</strong><p>This prototype uses the public Client ID and a short-lived browser token. The production version should move to server-managed authorization and a shared overlay transport.</p><a href="https://dev.twitch.tv/docs/" target="_blank" rel="noreferrer">Read Twitch developer docs <ChevronRight size={13}/></a></div><span className="step-status status-needed">NEEDS TEST</span></div>
        <div className="connection-step"><span className="step-number">03</span><div><strong>Test with your own channel</strong><p>Send a real chat message and confirm it appears here. Chat commands change local demo case state; real voting controls and the OBS overlay still need production wiring.</p><span className="connection-note"><LockKeyhole size={13}/> Never paste OAuth secrets into chat or frontend code.</span></div><span className="step-status status-pending">PENDING</span></div>
      </div>
      <div className="codex-brief-card"><div className="codex-brief-icon"><BrainCircuit size={19}/></div><div className="codex-brief-copy"><strong>Codex implementation brief</strong><p>Task list for real Twitch integration, AI-assisted theory clustering, tests and README setup.</p></div><button className="primary-button" onClick={copyCodexBrief}><Copy size={15}/> {copied?"Copied":"Copy brief"}</button></div>
      <div className="modal-bottom"><span className="soft-status"><span className={"status-dot "+(isTwitchConnected?"status-connected":"")}/> {isTwitchConnected ? "Twitch chat connected" : "Twitch not connected"}</span><button className="secondary-button" onClick={()=>setShowConnection(false)}>Done for now</button></div>
    </section></div>}
    {toast&&<div className="toast" role="status"><span className="toast-check"><Check size={14}/></span>{toast}</div>}
  </div>;
}

function Metric({icon,label,value,trend,trendUp}) {
  return <div className="metric-item"><div className="metric-top"><span className="metric-icon">{icon}</span><span>{label}</span></div><div className="metric-bottom"><strong>{value}</strong><span className={trendUp?"metric-trend trend-up":"metric-trend"}>{trendUp&&<ArrowUpRight size={12}/>} {trend}</span></div></div>;
}

function LiveCaseView(p) {
  const {channel,isTwitchConnected,resetVersion,messages,theories,setTheories,clues,input,setInput,addMessage,voteActive,setVoteActive,revealClue,chapter,setChapter,showToast,replayChat,replaying,resetDemo,selectedTheory,setSelectedTheory,voteCount,setVoteCount,visibleClues,showAllClues,setShowAllClues,currentLeader,showConnection}=p;
  const [rightPanel,setRightPanel]=useState("intelligence");
  const [caseTab,setCaseTab]=useState("Evidence board");
  const [voted,setVoted]=useState(false);
  const [voteSearch,setVoteSearch]=useState("");
  const [aiAnalysis,setAiAnalysis]=useState(null);
  const [aiBusy,setAiBusy]=useState(false);
  const [aiError,setAiError]=useState("");
  useEffect(() => { setVoted(false); setAiAnalysis(null); setAiError(""); }, [resetVersion]);
  const handleSubmit=(e)=>{e.preventDefault();if(!input.trim())return;addMessage(input,"you","#b8a5ff");setInput("");};
  const castVote=(id)=>{if(!voteActive){showToast("Start a vote before casting a community vote");return;}if(voted){showToast("Your demo vote is already recorded");return;}setSelectedTheory(id);setVoted(true);setVoteCount((v)=>v+1);setTheories((prev)=>prev.map((t)=>t.id===id?{...t,votes:t.votes+1}:t));showToast("Your vote has been counted");};
  const total=theories.reduce((s,t)=>s+t.votes,0)||1;
  const actualChatMessages = messages.filter((m) => m.source === "twitch" && m.kind !== "system").slice(-40);
  const runAiAnalysis = async () => {
    if (actualChatMessages.length < 3) {
      showToast("Collect at least 3 real Twitch chat messages first");
      return;
    }
    setAiBusy(true);
    setAiError("");
    try {
      const result = await analyzeChatTheories({
        data: {
          messages: actualChatMessages.map((m) => ({
            id: String(m.id),
            userName: String(m.name).slice(0, 40),
            text: String(m.text).slice(0, 300),
            timestamp: String(m.time || ""),
          })),
        },
      });
      setAiAnalysis(result);
      showToast("AI analysis completed for real Twitch messages");
    } catch (error) {
      const theoriesFromChat = actualChatMessages
        .filter((m) => m.text.toLowerCase().startsWith("!theory"))
        .map((m) => ({ title: m.text.replace(/^!theory\s*/i, "").trim(), sourceMessageIds: [String(m.id)] }))
        .filter((m) => m.title.length > 0);
      const recent = actualChatMessages.slice(-3);
      setAiAnalysis({
        mode: "heuristic",
        analyzedMessageCount: actualChatMessages.length,
        summary: "The AI service was unavailable, so this is a transparent heuristic fallback. It surfaces viewer-submitted theories without inferring guilt or inventing evidence.",
        leadingTheory: guardLeadingTheory(theoriesFromChat[0]?.title || "No !theory submission has arrived yet.", theoriesFromChat[0]?.sourceMessageIds || []),
        leadingTheorySourceMessageIds: theoriesFromChat[0]?.sourceMessageIds || [],
        evidence: recent.map((m) => ({ claim: "@" + m.name + " wrote: " + m.text, sourceMessageIds: [String(m.id)] })),
        counterargument: "This fallback does not judge whether any theory is true. Chat messages are hypotheses, not verified case evidence.",
        theoryGroups: theoriesFromChat.slice(0, 4).map((t) => ({ ...t, rationale: "Direct viewer submission; no AI similarity inference performed.", confidence: 0.35 })),
      });
      setAiError(error instanceof Error ? error.message : "AI analysis failed; showing the clearly labelled heuristic fallback.");
      showToast("AI unavailable — displaying heuristic fallback");
    } finally {
      setAiBusy(false);
    }
  };
  return <>
    <div className="case-heading"><div><div className="case-kicker"><span className="live-indicator"><span/> LIVE CASE</span><span className="heading-divider">/</span><span className="case-id">CASE #0042</span><span className="difficulty-pill">COMMUNITY MYSTERY</span></div><h1>The Midnight Gallery Heist <span className="title-edit"><ChevronDown size={17}/></span></h1><p className="case-subtitle">A priceless clockwork bird vanished during a 47-second blackout.</p></div><div className="heading-actions"><button className="secondary-button" onClick={resetDemo}><RefreshCw size={15}/> Reset demo</button><button className="primary-button" onClick={showConnection}><Link2 size={15}/> Connect Twitch</button></div></div>
    <div className="metric-strip"><Metric icon={<Eye size={16}/>} label="VIEWERS IN CASE" value="—" trend="Not tracked"/><Metric icon={<MessageSquare size={16}/>} label={isTwitchConnected?"REAL CHAT MESSAGES":"CHAT MESSAGES"} value={String(isTwitchConnected?messages.filter((m)=>m.source==="twitch").length:messages.length)} trend={isTwitchConnected?"Live Twitch feed":"Demo seed data"}/><Metric icon={<Lightbulb size={16}/>} label="THEORIES FOUND" value={String(theories.length)} trend={isTwitchConnected?"Submitted in chat":"Demo data"}/><Metric icon={<Vote size={16}/>} label="COMMUNITY VOTES" value={String(voteCount)} trend={isTwitchConnected?"Local session":"Demo value"}/></div>
    <div className="stream-summary"><div className="stream-thumb"><div className="thumb-moon"/><div className="thumb-window"/><div className="thumb-clock"><Clock3 size={24}/></div><span>STREAM PREVIEW</span></div><div className="stream-meta"><div className="stream-status-line"><span className="status-live-dot"/> LIVE CASE SESSION <span className="stream-separator">·</span><ClockText>00:42:17</ClockText></div><h3>Can chat crack the case? <span className="stream-label">DEMO STREAM</span></h3><p>Hosted by <strong>@{channel}</strong> <span className="stream-separator">·</span> Chapter {chapter}: {chapter===1?"The Disappearance":chapter===2?"The Evidence":chapter===3?"Suspect Showdown":"Final Verdict"}</p></div><div className="stream-mini-stats"><div><span>CASE PROGRESS</span><strong>{chapter*25}%</strong><div className="mini-progress"><i style={{width:(chapter*25)+"%"}}/></div></div><div><span>LEADING THEORY</span><strong className="leader-name">{currentLeader?currentLeader.title.split(" ").slice(0,3).join(" "):"No theories yet"}</strong></div></div></div>
    <div className="case-layout">
      <div className="center-column">
        <div className="panel evidence-panel"><div className="panel-head"><div><div className="section-eyebrow"><span className="section-icon"><Fingerprint size={15}/></span> CASE FILE</div><h2>Evidence board</h2><p>Every clue changes the story. Every theory moves the case forward.</p></div><button className="secondary-button small-button" onClick={()=>setShowAllClues(!showAllClues)}>{showAllClues?"Show less":"View all clues"} <ChevronRight size={14}/></button></div>
          <div className="case-tabs">{["Evidence board","Suspects"].map((tab)=><button key={tab} className={caseTab===tab?"case-tab active":"case-tab"} onClick={()=>setCaseTab(tab)}>{tab}<span>{tab==="Evidence board"?clues.length:"04"}</span></button>)}</div>
          {caseTab==="Evidence board"?<div className="clue-grid">{visibleClues.map((clue,index)=><ClueCard key={clue.id} clue={clue} index={index}/>)}{clues.length<4&&<button className="add-clue-card" onClick={revealClue}><div><Plus size={18}/></div><strong>Reveal next clue</strong><span>Unlock new evidence</span></button>}</div>:<div className="suspects-grid">{suspects.map((s)=><div key={s.name} className="suspect-card"><div className="suspect-top"><div className="suspect-avatar" style={{background:s.color}}>{s.initials}</div><span className={"suspect-badge "+s.badge.toLowerCase().replace(" ","-")}>{s.badge}</span></div><h3>{s.name}</h3><span className="suspect-role">{s.role}</span><p>{s.detail}</p><div className="suspect-clue"><Fingerprint size={13}/> {s.clue}</div></div>)}</div>}
          <div className="panel-foot-note"><Shield size={14}/><span>Clues are fictional and local to this browser session; case state is not yet shared with OBS across devices.</span><button onClick={showConnection}>Integration status <ChevronRight size={13}/></button></div>
        </div>
        <div className="panel timeline-panel"><div className="panel-head slim"><div><div className="section-eyebrow"><span className="section-icon peach"><Clock3 size={14}/></span> TIMELINE</div><h2>Reconstruct the blackout</h2></div><span className="timeline-badge"><Activity size={13}/>{chapter<3?"INVESTIGATING":chapter===3?"DELIBERATING":"VERDICT READY"}</span></div>
          <div className="timeline-track"><TimelineEvent time="9:12 PM" title="Gallery closes" desc="All guests are asked to leave." state="complete"/><TimelineEvent time="9:16 PM" title="Blackout begins" desc="Power drops for 47 seconds." state="complete"/><TimelineEvent time="9:17 PM" title="Clockwork bird is missing" desc="Display case found open." state="active"/><TimelineEvent time="UNKNOWN" title="Escape route" desc="Chat must connect the final clues." state="pending"/></div><div className="timeline-footer"><span><i className="tiny-purple-dot"/> 3 events confirmed</span><button onClick={revealClue}><Plus size={14}/> Add evidence</button></div>
        </div>
      </div>
      <aside className="right-column">
        <div className="panel intelligence-panel"><div className="right-tabs"><button className={rightPanel==="intelligence"?"right-tab active":"right-tab"} onClick={()=>setRightPanel("intelligence")}><BrainCircuit size={15}/> Intelligence</button><button className={rightPanel==="chat"?"right-tab active":"right-tab"} onClick={()=>setRightPanel("chat")}><MessageCircle size={15}/> Live chat</button></div>
          {rightPanel==="intelligence"?<><div className="intelligence-heading"><div><div className="section-eyebrow">COMMUNITY SIGNAL</div><h2>Theory tracker <span className="theory-count">{theories.length}</span></h2></div><div className="signal-pulse"><span/><span/><span/></div></div><div className="intelligence-caption"><Sparkles size={14}/> Similar theories are grouped by a simple text-matching heuristic in this demo.</div>
            <section className="ai-analysis-strip">
              <div className="ai-analysis-top"><div><span className="ai-analysis-label"><BrainCircuit size={13}/> AI CASE INTELLIGENCE</span><strong>Grounded in actual chat</strong><p>Analyze only real Twitch messages, with source-message references.</p></div>
                <button className="ai-analyze-button" onClick={runAiAnalysis} disabled={aiBusy || actualChatMessages.length < 3}>{aiBusy?<RefreshCw className="spin-icon" size={14}/>:<Sparkles size={14}/>} {aiBusy?"Analyzing…":"Analyze chat"}</button>
              </div>
              <div className="ai-input-status"><span className={actualChatMessages.length>=3?"ai-ready-dot":"ai-wait-dot"}/>{actualChatMessages.length} real chat message{actualChatMessages.length===1?"":"s"} collected {actualChatMessages.length<3?"— need 3 to analyze":"— ready"}</div>
              {aiError&&<p className="ai-error-note">{aiError}</p>}
              {aiAnalysis&&<div className="ai-analysis-result">
                <div className="ai-result-heading"><span className={"ai-result-mode "+(aiAnalysis.mode==="ai"?"mode-ai":"mode-fallback")}>{aiAnalysis.mode==="ai"?"AI ANALYSIS":"HEURISTIC FALLBACK"}</span><span>{aiAnalysis.analyzedMessageCount} messages · {aiAnalysis.generatedAt?new Date(aiAnalysis.generatedAt).toLocaleTimeString():"local result"}</span></div>
                <p className="ai-summary-text">{aiAnalysis.summary}</p>
                <div className="ai-leader-block"><span>LEADING CHAT HYPOTHESIS</span><strong>{aiAnalysis.leadingTheory}</strong>
                  {aiAnalysis.leadingTheorySourceMessageIds?.length>0&&<small className="ai-leading-sources">Source messages: {aiAnalysis.leadingTheorySourceMessageIds.map((id)=>{const source=actualChatMessages.find((m)=>String(m.id)===id);return source?"@"+source.name:null;}).filter(Boolean).join(", ")}</small>}
                </div>
                {aiAnalysis.evidence?.length>0&&<div className="ai-evidence-list"><span className="ai-subheading">CHAT SIGNALS</span>{aiAnalysis.evidence.map((e,i)=><div className="ai-evidence-row" key={i}><p>{e.claim}</p><span>{e.sourceMessageIds.map((id)=>actualChatMessages.find((m)=>String(m.id)===id)?.name).filter(Boolean).map((name)=>"@"+name).join(", ")||"source reference"}</span></div>)}</div>}
                {aiAnalysis.theoryGroups?.length>0&&<div className="ai-group-list"><span className="ai-subheading">SUBMITTED THEORY GROUPS</span>{aiAnalysis.theoryGroups.map((g,i)=><div className="ai-group-row" key={i}><div><strong>{g.title}</strong><p>{g.rationale}</p></div><span>{Math.round(g.confidence*100)}%</span></div>)}</div>}
                <div className="ai-counterpoint"><span>COUNTERPOINT / LIMITATION</span><p>{aiAnalysis.counterargument}</p></div>
              </div>}
              <p className="ai-disclaimer">AI output is an interpretation of chat, not proof of guilt. The fallback is labelled and does not pretend to be AI.</p>
            </section>
            <div className="theory-list">{[...theories].sort((a,b)=>b.votes-a.votes).filter((t)=>!voteSearch||t.title.toLowerCase().includes(voteSearch.toLowerCase())).map((t,index)=><button key={t.id} className={"theory-card "+(selectedTheory===t.id?"selected":"")} onClick={()=>{setSelectedTheory(t.id);if(voteActive&&!voted)showToast("Selected theory — cast your vote below");}}><div className="theory-top"><span className={"theory-rank "+(index===0?"rank-first":"")}>{String(index+1).padStart(2,"0")}</span><span className={"theory-tag "+t.color}>{t.tag}</span><span className="theory-votes"><Vote size={12}/> {t.votes}</span></div><p>{t.title}</p><div className="theory-meter"><span style={{width:(t.votes/Math.max(...theories.map((x)=>x.votes),1)*100)+"%"}}/></div><div className="theory-footer"><span>by {t.by}</span><span>{Math.round(t.votes/total*100)}% of votes</span></div></button>)}</div>
            <div className="vote-cta"><div className="vote-cta-top"><div className="vote-icon"><Vote size={17}/></div><div><strong>{voteActive?"Community vote is open":"Voting is paused"}</strong><span>{voteCount} votes recorded across the case</span></div></div>{voteActive&&<button className="cast-vote-button" onClick={()=>castVote(selectedTheory)} disabled={voted}><Check size={15}/>{voted?"Your vote is in":"Vote for selected theory"}</button>}<button className="text-action centered" onClick={()=>{if(!voteActive)setVoted(false);setVoteActive(!voteActive);showToast(voteActive?"Vote closed":"Vote opened for the community");}}>{voteActive?"End vote":"Start a vote"} <ArrowUpRight size={13}/></button></div>
          </>:<LiveChat messages={messages} input={input} setInput={setInput} onSubmit={handleSubmit} isTwitchConnected={isTwitchConnected}/>}
        </div>
        <div className="panel chat-panel"><div className="panel-head compact-head"><div><div className="section-eyebrow"><span className="section-icon mint"><MessageSquare size={14}/></span> LIVE ACTIVITY</div><h2>Chat highlights</h2></div><button className="text-action" onClick={()=>setRightPanel("chat")}>View chat <ChevronRight size={13}/></button></div>
          <div className="chat-highlight-list">{messages.slice(-3).reverse().map((m)=><div className="chat-highlight" key={m.id}><div className="chat-avatar" style={{background:m.color}}>{m.name.slice(0,1).toUpperCase()}</div><div className="chat-highlight-copy"><div><strong>{m.name}</strong><ClockText>{m.time}</ClockText></div><p>{m.text}</p></div></div>)}</div>
          <button className="replay-button" onClick={replayChat}>{replaying?<X size={14}/>:<Play size={14} fill="currentColor"/>}{replaying?"Pause audience test":"Run audience test"}<span>Replay 5 sample messages</span></button>
        </div>
      </aside>
    </div>
    <div className="streamer-controlbar"><div className="controlbar-label"><div className="controlbar-icon"><AudioLines size={17}/></div><div><strong>Streamer controls</strong><span>Changes apply to the demo overlay</span></div></div><div className="controlbar-actions"><button className="control-action" onClick={revealClue}><Plus size={15}/> Reveal clue</button><button className="control-action" onClick={()=>{if(!voteActive)setVoted(false);setVoteActive(!voteActive);showToast(voteActive?"Community vote ended":"Community vote started");}}><Vote size={15}/>{voteActive?"End vote":"Start vote"}</button><button className="control-action purple-control" onClick={()=>{const next=chapter>=4?1:chapter+1;setChapter(next);showToast("Advanced to chapter "+next);}}><ArrowDownRight size={15}/> Advance chapter</button><button className="control-action" onClick={()=>window.open("/overlay","_blank","noopener,noreferrer")}><Eye size={15}/> Open overlay</button></div></div>
    <div className="integration-banner"><div className="integration-banner-icon"><AlertCircle size={16}/></div><div><strong>{isTwitchConnected?"Live Twitch chat is connected.":"Twitch chat is not connected yet."}</strong><span>{isTwitchConnected?"Incoming messages are live; case state and voting still run locally in this prototype.":"Use Connect Twitch to authorize chat, or continue with simulated messages. OBS-wide overlay sync and production hardening remain unfinished."}</span></div><button onClick={showConnection}>Setup integration <ChevronRight size={14}/></button></div>
  </>;
}
function TimelineEvent({time,title,desc,state}) { return <div className={"timeline-event "+state}><div className="timeline-dot">{state==="complete"&&<Check size={11}/ >}{state==="active"&&<span/>}</div><div><ClockText>{time}</ClockText><strong>{title}</strong><p>{desc}</p></div></div>; }

function ClueCard({clue,index}) {
  const isNew=clue.status==="NEW"||clue.status==="JUST REVEALED";
  return <article className={"clue-card clue-card-"+index+(isNew?" clue-new":"")}><div className="clue-image"><div className={"clue-visual visual-"+clue.icon}>{clue.icon==="fingerprint"&&<Fingerprint size={39} strokeWidth={1.25}/ >}{clue.icon==="clock"&&<Clock3 size={42} strokeWidth={1.25}/ >}{clue.icon==="fiber"&&<AudioLines size={40} strokeWidth={1.25}/ >}{clue.icon==="gear"&&<Settings2 size={39} strokeWidth={1.25}/ >}<span className="visual-crosshair"/></div><span className="clue-status">{isNew&&<i/>}{clue.status}</span><span className="clue-number">{clue.number}</span></div><div className="clue-copy"><div className="clue-type">{clue.type}</div><h3>{clue.title}</h3><p>{clue.body}</p><div className="clue-foot"><span><LockKeyhole size={11}/> CASE EVIDENCE</span><button onClick={()=>window.alert(clue.title+"\n\n"+clue.body)}>Inspect <ChevronRight size={12}/></button></div></div></article>;
}
function LiveChat({messages,input,setInput,onSubmit,isTwitchConnected}) {
  return <div className="live-chat-view"><div className="chat-mode-row"><span><i className="tiny-green-dot"/> {isTwitchConnected?"Live Twitch chat":"Simulated channel chat"}</span><span>{messages.length} messages shown</span></div><div className="full-chat-list">{messages.slice(-18).map((m)=><div key={m.id} className={"full-chat-message "+(m.kind==="system"?"system-message":"")}><div className="full-chat-meta"><strong style={{color:m.color}}>{m.name}</strong><ClockText>{m.time}</ClockText>{m.kind==="theory"&&<span className="chat-type-tag">THEORY</span>}</div><p>{m.text}</p></div>)}</div><form className="chat-compose" onSubmit={onSubmit}><input aria-label={isTwitchConnected?"Local test message (not sent to Twitch)":"Simulated chat message"} placeholder={isTwitchConnected?"Local test message (not sent to Twitch)…":"Send a demo chat message…"} value={input} onChange={(e)=>setInput(e.target.value)} maxLength={240}/><button className="send-button" type="submit" aria-label="Send message" disabled={!input.trim()}><Send size={15}/></button></form><div className="command-hint"><code>!theory</code> submit theory <code>!vote curator</code> vote <code>!clue</code> reveal clue in demo. Twitch chat commands affect local case state.</div></div>;
}

function CaseLibrary({onStart}) {
  return <div className="secondary-view"><div className="case-heading"><div><div className="case-kicker"><span className="section-icon"><BookOpen size={14}/></span><span className="case-id">CASE LIBRARY</span></div><h1>Stories built for the chat</h1><p className="case-subtitle">Launch a community mystery or draft your own interactive case.</p></div><button className="primary-button" onClick={()=>window.alert("Custom case editor is planned after the Twitch integration MVP.")}><Plus size={15}/> New case</button></div>
    <div className="library-grid"><article className="library-card featured-library"><div className="library-art"><div className="art-clock"><Clock3 size={64} strokeWidth={1}/></div><span>CASE 0042</span><div className="art-vignette"/></div><div className="library-card-body"><div className="library-meta"><i className="status-live-dot"/> READY TO PLAY <span>·</span> 20–35 MIN</div><h2>The Midnight Gallery Heist</h2><p>A priceless clockwork bird disappears during a 47-second blackout. Four suspects. One truth. Your community decides.</p><div className="library-stats"><span><Fingerprint size={14}/> 4 suspects</span><span><Lightbulb size={14}/> 8 clues planned</span><span><MessageCircle size={14}/> Chat-driven</span></div><button className="primary-button full-width" onClick={onStart}><Play size={15} fill="currentColor"/> Open live case <ChevronRight size={15}/></button></div></article>
      <article className="library-card locked-library"><div className="library-lock"><LockKeyhole size={24}/></div><span className="eyebrow">COMING NEXT</span><h2>The Last Train at 12:04</h2><p>A passenger is missing. Chat must find which station the train never reached.</p><span className="library-chip">SOCIAL DEDUCTION</span></article>
      <article className="library-card locked-library"><div className="library-lock mint-lock"><BrainCircuit size={24}/></div><span className="eyebrow">COMING NEXT</span><h2>Signal in the Static</h2><p>A strange broadcast arrives. Your community decodes the clues in real time.</p><span className="library-chip">PUZZLE MYSTERY</span></article></div>
    <div className="library-note"><Shield size={15}/> This library currently contains fictional demo content. Custom case authoring is not implemented yet.</div></div>;
}

function Insights({messages,theories,voteCount,clues,isTwitchConnected}) {
  const [range,setRange]=useState("This session");
  return <div className="secondary-view"><div className="case-heading"><div><div className="case-kicker"><span className="section-icon"><BarChart3 size={14}/></span><span className="case-id">COMMUNITY INTELLIGENCE</span></div><h1>Participation that tells a story.</h1><p className="case-subtitle">Understand how viewers contributed to the investigation.</p></div><select className="filter-select" value={range} onChange={(e)=>setRange(e.target.value)} aria-label="Insight time range"><option>This session</option><option>Last 7 days</option><option>Last 30 days</option></select></div>
    <div className="insight-metrics"><Metric icon={<MessageSquare size={16}/>} label={isTwitchConnected?"REAL CHAT MESSAGES":"CHAT MESSAGES"} value={String(isTwitchConnected?messages.filter((m)=>m.source==="twitch").length:messages.length)} trend={isTwitchConnected?"Live feed":"Seeded demo data"}/><Metric icon={<Lightbulb size={16}/>} label="THEORIES FOUND" value={String(theories.length)} trend={isTwitchConnected?"Local session":"Demo data"}/><Metric icon={<Vote size={16}/>} label="VOTES" value={String(voteCount)} trend={isTwitchConnected?"Local session":"Demo value"}/><Metric icon={<Fingerprint size={16}/>} label="CLUES REVEALED" value={String(clues.length)} trend="In this browser session"/></div>
    <div className="insights-layout"><div className="panel insight-chart-panel"><div className="panel-head"><div><div className="section-eyebrow">PARTICIPATION</div><h2>Community activity</h2><p>Illustrative sample activity for {range.toLowerCase()}.</p></div><span className="demo-label">SIMULATED</span></div><div className="activity-chart">{[35,50,44,72,55,82,68,91,74,60,88,100,76,63,85,58,73,94,68,81,52,70,87,61].map((h,i)=><div key={i} className="chart-bar-wrap"><span className="chart-bar" style={{height:h+"%"}}/></div>)}</div><div className="chart-xaxis"><span>START</span><span>CASE LAUNCH</span><span>NOW</span></div></div>
      <div className="panel insight-leaders"><div className="panel-head slim"><div><div className="section-eyebrow">ILLUSTRATIVE SAMPLE</div><h2>Example contributors</h2><p>These names and scores are fictional design samples, not live Twitch rankings.</p></div><Crown size={17} className="leader-crown"/></div>{[{name:"orbitalsoup",points:9,color:"#b2a2ff"},{name:"lunarbyte",points:7,color:"#8bd9ce"},{name:"moss.exe",points:6,color:"#ffbd78"},{name:"pixelpilgrim",points:4,color:"#ff91b4"}].map((p,i)=><div className="contributor-row" key={p.name}><span className={"contributor-rank rank-"+i}>{i+1}</span><div className="contributor-avatar" style={{background:p.color}}>{p.name[0].toUpperCase()}</div><strong>{p.name}</strong><span>{p.points} pts</span></div>)}</div></div>
    <div className="integration-banner"><div className="integration-banner-icon"><AlertCircle size={16}/></div><div><strong>These are illustrative demo metrics.</strong><span>Real analytics can be calculated after Twitch chat events are connected and stored.</span></div></div></div>;
}

function SettingsPanel({channel,setChannel,twitchClientId,setTwitchClientId,twitchStatus,twitchError,isTwitchConnected,onTwitchConnect,onTwitchDisconnect,onConnect,showToast}) {
  const [overlaySize,setOverlaySize]=useState("1080p");
  const [moderation,setModeration]=useState(true);
  return <div className="secondary-view"><div className="case-heading"><div><div className="case-kicker"><span className="section-icon"><Settings2 size={14}/></span><span className="case-id">PREFERENCES</span></div><h1>Make the case yours.</h1><p className="case-subtitle">Configure the streamer experience and integration checklist.</p></div><button className="primary-button" onClick={onConnect}><Link2 size={15}/> Twitch setup</button></div>
    <div className="settings-grid"><section className="panel settings-card"><div className="settings-title"><div className="settings-icon violet-settings"><Radio size={17}/></div><div><h2>Channel & connection</h2><p>Connect a Twitch test channel using a public Client ID.</p></div></div><label className="field-label" htmlFor="channel-name">Twitch channel name</label><div className="input-with-prefix"><span>@</span><input id="channel-name" value={channel} onChange={(e)=>setChannel(e.target.value.replace(/^@/,"").replace(/\s/g,""))} maxLength={25}/></div><label className="field-label" htmlFor="settings-twitch-client-id">Public Twitch Client ID</label><input id="settings-twitch-client-id" className="twitch-client-input" value={twitchClientId} onChange={(e)=>setTwitchClientId(e.target.value.trim())} placeholder="Twitch Client ID" autoComplete="off" spellCheck={false}/>
      <div className="connection-status-row"><div className={"status-mark "+(isTwitchConnected?"status-online":"status-offline")}><Radio size={14}/></div><div><strong>Twitch chat</strong><span>{twitchStatus}</span></div><span className={"status-pill "+(isTwitchConnected?"on-pill":"off")}>{isTwitchConnected?"CONNECTED":"OFFLINE"}</span></div>
      {twitchError&&<p className="twitch-error">{twitchError}</p>}
      <div className="twitch-actions">{isTwitchConnected?<button className="secondary-button full-width" onClick={onTwitchDisconnect}><X size={14}/> Disconnect Twitch</button>:<button className="primary-button full-width" onClick={onTwitchConnect}><Link2 size={15}/> Authorize Twitch chat</button>}</div>
      <button className="secondary-button full-width" onClick={onConnect}><Shield size={15}/> Security & connection checklist</button>
      <p className="settings-help">OAuth redirect URI: <code>{typeof window!=="undefined"?window.location.origin+"/":""}</code>. Register this exact URI in the Twitch Developer Console. Public Client ID only; never enter a Client Secret in this browser app.</p></section>
    <section className="panel settings-card"><div className="settings-title"><div className="settings-icon cyan-settings"><MousePointer2 size={17}/></div><div><h2>Overlay display</h2><p>Demo preferences for the browser-source overlay.</p></div></div><label className="field-label" htmlFor="overlay-size">Output resolution</label><select id="overlay-size" className="settings-select" value={overlaySize} onChange={(e)=>setOverlaySize(e.target.value)}><option>1080p</option><option>720p</option><option>1440p</option></select><div className="setting-toggle-row"><div><strong>Chat safety guardrails</strong><p>Plan to filter abusive content and spam in real chat.</p></div><button className={"toggle-switch "+(moderation?"on":"")} onClick={()=>setModeration(!moderation)} aria-label="Toggle chat safety guardrails"><span/></button></div><div className="settings-callout"><Shield size={15}/><span>{moderation?"Guardrails selected for the implementation plan.":"Guardrails are off in this local preference; moderation should remain enabled for production."}</span></div></section>
    <section className="panel settings-card settings-wide"><div className="settings-title"><div className="settings-icon amber-settings"><BrainCircuit size={17}/></div><div><h2>AI & community intelligence</h2><p>Deterministic matching and a server-side AI analysis path are now available in the prototype.</p></div></div><div className="ai-capability-list"><div><span className="capability-icon active-cap"><Check size={13}/></span><div><strong>Duplicate text matching</strong><p>Deterministic heuristic with automated unit tests.</p></div><span className="status-pill on-pill">TESTED</span></div><div><span className="capability-icon todo-cap"><Sparkles size={13}/></span><div><strong>Server-side AI analysis</strong><p>Analyzes real Twitch chat only, validates structured output and restricts source references to supplied messages. Live model invocation still needs verification.</p></div><span className="status-pill off">CALL TEST PENDING</span></div><div><span className="capability-icon active-cap"><Check size={13}/></span><div><strong>Twitch EventSub chat</strong><p>Connected successfully in the current browser session. Real messages appear in Live chat; case state remains local.</p></div><span className="status-pill on-pill">CONNECTED</span></div></div><button className="primary-button" onClick={()=>{onConnect();showToast("Codex task brief is available in integration setup");}}><Copy size={15}/> Open Codex task brief</button></section></div></div>;
}
