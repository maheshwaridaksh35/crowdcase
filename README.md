# CrowdCase — The chat is the detective

CrowdCase is an interactive community-mystery concept for Twitch creators. A streamer controls a fictional investigation while viewers submit theories, vote on explanations, and inspect clues in The Midnight Gallery Heist.

## Current app features

- Responsive creator dashboard with evidence board, suspects, story timeline, local vote controls, chapter controls, case library, Settings, and Insights.
- Twitch OAuth authorization flow and EventSub WebSocket connector for the channel account that authorizes the app.
- Real channel.chat.message events appear in Live chat. The connection was manually exercised successfully: a real message was shown in the CrowdCase UI.
- Chat command parsing for !theory, !vote, and !clue. Commands update the current dashboard session's local case state; they are not yet a persistent multiplayer voting backend.
- Deterministic theory matching using normalized terms and token similarity.
- Server-side AI analysis path using the Base44 AI gateway, with schema-validated output and source-message references restricted to message IDs supplied by the caller. The Live Case Intelligence panel only sends actual Twitch messages, and it labels the model result separately from a heuristic fallback.
- A separate /overlay view with evidence, theories, votes and recent chat. The local demo sync works through BroadcastChannel/localStorage between compatible same-origin tabs in the same browser profile.
- Unit tests for command parsing, theory matching, vote validation, and AI source-reference filtering.

## Verification status (28 Oct 2026)

- npm test: 9 tests pass.
- npm run build: passes.
- npm run lint: passes.
- Published / and /overlay routes respond successfully.
- Real Twitch chat ingestion was manually verified by the project owner.
- The AI model gateway has successfully returned structured output in a direct smoke test using synthetic test messages. The test is not proof that the dashboard's real-Twitch-message flow was exercised. Collect at least three real Twitch chat messages, open Live Case → Intelligence, and click Analyze chat to verify the full UI path; confirm that it returns AI ANALYSIS rather than a labelled fallback.
- Production-ready OBS cross-context transport, shared persistent case state, a production OAuth/session design, automated EventSub integration tests, and repository publishing remain incomplete.
- Most importantly, this initial version was built in an app-building workspace, not yet substantially built in OpenAI Codex. The contest's Codex/session-ID requirement remains outstanding until actual Codex work is performed and the real /status session ID is saved.

## Run locally

Use Node.js LTS:

    npm install
    npm run dev

Verification commands:

    npm test
    npm run build
    npm run lint

Routes:
- / — creator dashboard
- /overlay — overlay preview

Stack: React, TanStack Start/Router, Vite, Lucide, TanStack AI, Zod, and the Base44 AI gateway.

## Connect Twitch

1. Register a Twitch application at https://dev.twitch.tv/console/apps.
2. Add the exact redirect URI shown in CrowdCase Settings.
3. Enter the public Client ID and the channel login of the account that will authorize the app.
4. Click Authorize Twitch chat and approve user:read:chat.
5. Confirm that a real chat message appears in CrowdCase Live chat.

Never put a Twitch Client Secret or private API key into the browser or commit one to the repository. The current browser connector uses an implicit token flow and holds the access token in component memory; it has no refresh-token flow and is for a hackathon prototype only. Before production, redesign authentication using a supported server-managed OAuth flow, session lifecycle, appropriate CSRF protections, and secret storage.

## AI analysis behavior

- Input is limited to 3–40 recent actual Twitch chat messages.
- Model invocation runs server-side through the app's AI gateway; the client receives structured output instead of an API key.
- The model is instructed to treat viewer messages as untrusted data, not to follow chat-provided instructions, and to distinguish a theory from established fictional case facts.
- Outputs include IDs of source messages, including a cited leading hypothesis. The server strips source IDs that do not exist in the supplied request, drops claims/groups that have no retained sources, and downgrades unsupported accusatory wording to an explicitly unverified hypothesis. Duplicate EventSub IDs are checked before command side effects so a replayed event cannot double-count a vote.
- A small in-memory IP rate limit (5 requests/minute per runtime instance) is a prototype guardrail, not production-grade rate limiting.
- If model invocation errors, the UI presents a clearly labelled heuristic fallback. The fallback does not claim an AI model ran.
- Model output is an interpretation of chat, not proof that a suspect is guilty.

## Overlay limitations

The dashboard currently synchronizes the overlay using BroadcastChannel and localStorage when both are opened as compatible same-origin tabs. This is not reliable shared transport across independent browser contexts, devices, or OBS Browser Source. A real stream integration needs a shared server-side case store and WebSocket/SSE transport, then must be tested inside OBS before claiming production overlay support.

## Official Twitch developer documentation

- Chat authentication: https://dev.twitch.tv/docs/chat/authenticating/
- Sending and receiving chat messages: https://dev.twitch.tv/docs/chat/send-receive-messages/
- OAuth tokens: https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/

## Codex × TwitchCon finish checklist

1. Open this source in OpenAI Codex and inspect the architecture. Do the substantial next round of implementation in that Codex thread—not just ask for a summary.
2. Capture the genuine Codex session ID using /status in the thread where most project work actually occurred. Never invent a session ID.
3. Verify AI by running Analyze chat against real chat messages and record an honest screen capture of the actual result or fallback.
4. Implement persistent/shared state and a production-grade transport for the OBS overlay; run an end-to-end test.
5. Add integration tests for OAuth failure, EventSub subscription, duplicate/reconnect/revocation, voting, message parsing, AI schema/source attribution, and secrets not leaking to client bundles.
6. Publish the complete source to a public or eligible GitHub/GitLab/Bitbucket repository. This app-builder workspace has not created that repository yet.
7. Record a public YouTube demo under three minutes showing the app genuinely working with Twitch and showing Codex work. Follow DEMO_SCRIPT.md.
8. Update SUBMISSION_DRAFT.md to reflect only functionality you personally verified, and submit the actual repository URL, demo URL, and real Codex session ID.

This is a tested prototype milestone, not a finished submission or a guarantee of winning. Do not make claims you cannot demonstrate.
