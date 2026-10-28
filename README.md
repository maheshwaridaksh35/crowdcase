# CrowdCase — The chat is the detective

CrowdCase is an interactive mystery for Twitch streams. Viewers send theories and vote on possible explanations while the streamer reveals fictional clues.

## Current prototype

- Live prototype: https://crowd-case-the-chat-is-the-detecti-e9dc35a0.base44.app
- Overlay preview: https://crowd-case-the-chat-is-the-detecti-e9dc35a0.base44.app/overlay

- Responsive creator dashboard, evidence board, suspects, timeline, chapter and clue controls.
- Twitch OAuth/EventSub WebSocket connector. The owner manually verified that a real Twitch chat message appeared in CrowdCase.
- `!theory`, `!vote`, and `!clue` command parsing and local dashboard state.
- Deterministic theory matching, vote validation, and bounded EventSub duplicate-event filtering.
- Server-side AI analysis path through the Base44 AI gateway with structured output, source-message IDs, and safeguards that label speculation as unverified.
- Separate `/overlay` preview.
- Nine unit tests cover command parsing, theory matching, vote validation, duplicate IDs, and AI source validation.

## Build / verification

Run with Node.js LTS:

    npm install
    npm run dev
    npm test
    npm run build
    npm run lint

The maintained workspace has passed all 9 tests, the production build, and lint. Both published routes return HTTP 200. The AI gateway returned structured output in a direct smoke test with synthetic messages; the full dashboard analysis flow with real Twitch messages should still be checked.

## Important limitations (be transparent)

- Twitch chat ingestion was confirmed; a full production OAuth/session design is not implemented.
- Case state and vote counts remain local to a dashboard session. The overlay is a preview using same-origin browser synchronization, not a fully tested OBS cross-context overlay.
- AI source IDs are filtered against supplied message IDs and risky accusatory wording is downgraded, but model output remains interpretation—not proof of guilt.
- The real Twitch chat UI-to-AI workflow, independent OBS transport, and automated EventSub integration tests are still unfinished.
- This project started in an app-building workspace. Substantial implementation in OpenAI Codex and the genuine `/status` session ID are still required before claiming Codex compliance.

## Connect Twitch

1. Register an app in https://dev.twitch.tv/console/apps.
2. Register the exact redirect URI shown in CrowdCase Settings.
3. Enter the public Client ID and the login of the account that will authorize the app.
4. Authorize `user:read:chat` and verify a message appears.

Never share or commit a Twitch Client Secret, access token, or private AI key. The current client-side OAuth prototype is not intended for production use.

## Next steps

1. Open this source in Codex and implement meaningful changes in that thread.
2. Run `/status` in that Codex thread once most of the work has been done and record the real session ID.
3. Collect real Twitch messages and test Live Case → Intelligence → Analyze chat.
4. Implement persistent shared state and a tested OBS transport.
5. Publish all source, tests, and setup guidance in the repo.
6. Record a public YouTube demonstration under three minutes showing real Twitch behavior and Codex development.

Use only verified claims in the hackathon submission.
