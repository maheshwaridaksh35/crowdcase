# Codex handoff — CrowdCase

This initial prototype was created in an app-building workspace. The hackathon requires substantial implementation using OpenAI Codex, a working Twitch-connected project, a public code repository, a short public demo and the real Codex session ID. This document is a plan, not proof the Codex requirement has been met.

## Start in Codex

1. Open this repository in Codex.
2. Read README.md, src/routes/index.jsx, src/twitchEventSub.js, src/lib/ai-theories.js, src/lib/ai-validation.js, src/lib/theory-engine.js, src/lib/vote-engine.js, src/lib/message-idempotency.js, and tests/theory-engine.test.js.
3. Run npm install, npm test, npm run build, and npm run lint.
4. Have Codex review the architecture and make meaningful implementation changes with tests.
5. After substantial work in that Codex thread, run /status and save the genuine session ID.

## Highest-priority engineering

- Replace prototype implicit-token Twitch OAuth with a supported server-managed auth/session design before production. Never leak a Client Secret or token into browser JS, URLs, logs, or Git.
- Test the real dashboard flow: at least three actual Twitch chat messages, Live Case → Intelligence → Analyze chat, and verify AI ANALYSIS vs a clearly labelled fallback.
- Implement persistent, shared case state and secure WebSocket/SSE transport for the separate overlay. BroadcastChannel/localStorage is only a same-origin tab preview, not proof of OBS Browser Source integration.
- Add integration tests for OAuth failure/expiry, identity mismatch, EventSub subscription/reconnect/revocation, dedupe, one-vote-per-user, clue idempotency, AI schema/source attribution, prompt injection and secret leakage.
- Keep demo/sample metrics labelled as illustrative. AI output is an interpretation of chat, not verified evidence or proof of guilt.
- Preserve the 9 passing unit tests, production build, and lint checks as baseline.

## Submission gates

1. Publish the complete source and runnable setup instructions here.
2. Verify the live Twitch-to-AI path and OBS transport.
3. Use Codex for meaningful work and record the true session ID with /status.
4. Record a public YouTube video under 3 minutes with real Twitch behavior and Codex build footage.
5. Update submission copy to match only demonstrated functionality; never fabricate results, AI claims, Codex session IDs or integration status.
