# Codex handoff — CrowdCase

This is a prototype created in an app-building workspace, with a live Twitch EventSub connector verified by its owner. The competition requires substantial development using OpenAI Codex, a working Twitch-connected project, a repository, a public YouTube demo under 3 minutes, and the genuine Codex session ID. This file describes what to do next; it is not evidence that Codex has already built this app.

## Start here in Codex

1. Import/open this source bundle in Codex.
2. Read README.md, SUBMISSION_DRAFT.md, src/routes/index.jsx, src/twitchEventSub.js, src/lib/ai-theories.js, src/lib/ai-validation.js, src/lib/theory-engine.js, src/routes/overlay.jsx, and package.json.
3. Run npm install, npm test, npm run build, and npm run lint.
4. Have Codex inspect the current code, identify the key security and reliability risks, and make a concise engineering plan before editing.
5. Perform meaningful code changes in this Codex conversation, run tests, and use /status to save the authentic session ID once most project code has been implemented in that thread.

## Highest-priority technical work

### 1. Production Twitch auth and event handling
- Review current Twitch documentation: https://dev.twitch.tv/docs/chat/authenticating/ and https://dev.twitch.tv/docs/chat/send-receive-messages/.
- The owner manually verified that actual Twitch chat arrived in the app. Re-run the test after importing this source.
- Replace the prototype implicit-token design with a secure, supported server-managed auth/session flow. Never expose the Twitch Client Secret or private tokens in browser JS, URLs, logs, or repo.
- Add tested connection failures, subscription revocation, socket migration/reconnect, duplicate event idempotency, and cleanup.
- Current scope only supports the channel owner authorizing their own channel. Support for other broadcasters needs a broadcaster-approved bot authorization design.

### 2. Real shared state and OBS overlay
- BroadcastChannel and localStorage sync compatible same-origin browser tabs only; they are not sufficient for independent OBS contexts/devices.
- Implement persistent case state and authenticated/policy-limited shared WebSocket or SSE updates from backend to dashboard and overlay.
- Test actual !theory, !vote, !clue, one-vote-per-user per round, vote resets, clue reveal idempotency, and chapter state from real chat in OBS.
- Add reconnect, permission and offline states without silently blending simulation and actual data.

### 3. AI feature
- src/lib/ai-theories.js implements a server-side structured analysis call through the Base44 AI gateway.
- AI input must remain limited to actual Twitch messages, not seeded demo messages. Current UI requires at least 3 real chat messages.
- The actual model gateway returned structured output in a direct synthetic-message smoke test. The dashboard's real-Twitch-message UI flow is still pending: smoke-test Live Case → Intelligence → Analyze chat. If it fails, keep the heuristic fallback visibly labelled; do not claim the live path worked.
- Keep viewer messages untrusted. Add prompt-injection tests and source attribution tests. The server now drops invented source IDs and downgrades unsupported accusatory wording to an explicitly unverified hypothesis. Continue testing that model output is never presented as proof of guilt.
- The basic ****** 5/minute limit needs real shared rate limiting before production.

### 4. Test gates
- Existing npm test covers command parsing, theory matching, vote validation (closed/invalid/duplicate/valid), EventSub ID idempotency/bounds, source-ID filtering, and guardrails against unsupported accusations.
- Add integration tests for OAuth state mismatch/denial/expired token, Twitch identity mismatch, chat subscription/reconnect/revocation, duplicate events, one-vote-per-user, command length and rate limiting, AI schema and source attribution, and no client secret/API key in built client assets.
- npm run build, npm run lint, and npm test must all pass.

### 5. Required submission artifacts
- Publish the complete source, tests, README, .env.example, and setup instructions to a real GitHub/GitLab/Bitbucket repository. No repository has been created yet.
- Record the real Codex session ID with /status in the thread where most of the substantial project code was produced.
- Record a public YouTube demo under 3 minutes showing actual Twitch behavior and genuine Codex build footage. See DEMO_SCRIPT.md.
- Only then finalize the Devpost copy. Do not claim AI, Twitch, Codex, analytics, OBS support, or session IDs beyond the verified evidence.
