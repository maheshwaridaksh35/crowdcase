# CrowdCase — Devpost draft

## Project name
CrowdCase: The Chat Is the Detective

## Elevator pitch
A Twitch mystery where chat investigates together: viewers submit theories, vote on suspects, and unlock new evidence as the streamer advances the case.

## Project description (finalize only after remaining tests)
CrowdCase turns a livestream into a collaborative mystery. In The Midnight Gallery Heist, viewers examine clues, propose explanations and vote on leading theories while the streamer controls clue reveals and story chapters. A dedicated overlay preview is designed to show the audience's investigation.

The prototype includes a responsive evidence board, suspect profiles, a case timeline, theory tracking, clue and chapter controls. Twitch chat ingestion through OAuth/EventSub was verified by a real message appearing in CrowdCase. Commands can currently update local dashboard state; persistent shared voting and production OBS synchronization remain incomplete.

A server-side AI analysis path returns structured output with source-message IDs, and a direct smoke test succeeded with synthetic messages. Verify the full dashboard flow using genuine Twitch messages before claiming that AI analysis works end to end. AI output is an interpretation of chat, not verified evidence.

## Built with
React, TanStack Start/Router, Vite, Lucide, Twitch OAuth/EventSub WebSocket, TanStack AI, Zod, Base44 AI gateway.

## How Codex was used
Complete this section only after substantial implementation in OpenAI Codex. The initial dashboard was created in an app-building workspace. In the Codex thread where most of the project code is written, run /status and use the real session ID. Describe the real Codex contribution; never invent a session identifier.

## Final checklist
- [ ] Verify AI analysis from three or more actual Twitch chat messages.
- [ ] Test reconnect/failure cases and secure OAuth/session handling.
- [ ] Implement persistent shared state and test the overlay in OBS Browser Source.
- [ ] Run npm test, npm run build and npm run lint.
- [ ] Publish the complete repo and setup guide.
- [ ] Record the real Codex /status session ID.
- [ ] Record a public YouTube demo under 3 minutes with real Twitch behavior and Codex development.
- [ ] Replace this draft with final claims that match demonstrated behavior.
