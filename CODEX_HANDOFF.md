# Codex handoff — CrowdCase

This is the engineering handoff for the CrowdCase Twitch mystery prototype. The initial dashboard was created in an app-building workspace; the Codex-specific contest requirement is **not complete** until substantial development is performed in Codex and its genuine session ID is recorded.

## Start in Codex

1. Open this repository in Codex.
2. Read `README.md`, `src/routes/index.jsx`, `src/twitchEventSub.js`, `src/lib/ai-theories.js`, `src/lib/ai-validation.js`, `src/lib/theory-engine.js`, `src/lib/vote-engine.js`, `src/lib/message-idempotency.js`, and `tests/theory-engine.test.js`.
3. Run `npm install && npm test && npm run build && npm run lint`.
4. Review architecture/security risks, make meaningful code changes, and add integration tests.
5. Once most substantial project work is in that Codex thread, run `/status` and record the actual session ID.

## Priority engineering work

### Twitch authorization and events
- The owner manually verified that a real Twitch chat message arrived in CrowdCase.
- Current connector uses a browser-side prototype implicit-token flow, has no token refresh flow, and only supports authorizing the same channel account. It is not production auth.
- For production, implement supported server-managed authorization/session handling. Never expose a Twitch Client Secret or token in browser code, URLs, logs, or Git.
- Add tests for OAuth state mismatch, denial, expiry, identity mismatch, EventSub subscription failure, reconnect/migration, revocation and duplicate event IDs.

### Persistent case state and overlay
- `BroadcastChannel` and `localStorage` only help synchronize compatible same-origin browser tabs; they are not proof of a working OBS Browser Source integration.
- Implement persistent case state and secure, authenticated WebSocket/SSE updates that reach both dashboard and overlay.
- Test real `!theory`, `!vote`, and `!clue` commands, one vote per user per round, vote resets, clue idempotency and reconnect behavior.
- Make demo counts clearly distinct from live measurements.

### AI case intelligence
- The server-side AI gateway returned structured output in a direct smoke test using synthetic messages. The full dashboard workflow using actual Twitch messages is still pending.
- Test **Live Case → Intelligence → Analyze chat** with at least three real messages.
- Keep viewer messages untrusted; do not follow instructions embedded in chat.
- Validate all output against supplied message IDs and keep hypotheses distinct from verified case facts.
- If the model call fails, retain a clearly labelled heuristic fallback rather than implying an AI result was produced.
- The current in-memory per-runtime rate limit is only a prototype measure.

### Test gates
- Existing automated baseline: 9 unit tests pass; build and lint pass in the maintained workspace.
- Add integration tests for OAuth, EventSub lifecycle, idempotency, voting concurrency, AI schema/source attribution and absence of secrets from browser assets.
- Keep `npm test`, `npm run build`, and `npm run lint` green.

## Submission gates

1. Publish the complete, runnable source and setup instructions.
2. Verify the live Twitch-to-AI dashboard workflow and real overlay transport.
3. Perform meaningful implementation in Codex, then use `/status` to record the genuine session ID.
4. Record a public YouTube demonstration shorter than three minutes showing actual Twitch behavior and Codex development. See `DEMO_SCRIPT.md`.
5. Keep the Devpost description honest and aligned with verified behavior. Never fabricate AI results, Codex use, session IDs or working integrations.
