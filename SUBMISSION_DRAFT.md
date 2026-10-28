# CrowdCase — Devpost form draft

## Project name
CrowdCase: The Chat Is the Detective

## Elevator pitch
A Twitch mystery where chat investigates together: viewers submit theories, vote on suspects, and unlock new evidence as the streamer advances the case.

## Project description — finalize after end-to-end testing
CrowdCase turns a livestream into a collaborative mystery. In The Midnight Gallery Heist, viewers examine clues, submit theories and vote on possible explanations while the streamer reveals evidence and advances the story. A separate overlay preview is designed to make the audience's investigation visible on stream.

The prototype includes a responsive evidence board, suspect profiles, a case timeline, theory tracking, clue reveals and chapter controls. Twitch chat ingestion through OAuth/EventSub WebSocket was manually verified by a real message appearing in CrowdCase. Chat commands currently affect local dashboard state; persistent shared voting and production OBS synchronization remain incomplete.

A server-side AI analysis path is implemented with structured output and source-message references. A direct smoke test with synthetic messages returned a structured result, but the full dashboard workflow with actual Twitch messages still needs verification. Describe AI behavior only after that test. Model output is an interpretation of chat, not verified evidence.

## Built with
React, TanStack Start/Router, Vite, Lucide, Twitch OAuth/EventSub WebSocket, TanStack AI, Zod, Base44 AI gateway.

## How Codex was used
Complete this section only after genuine Codex development. The initial dashboard was created in an app-building workspace. Continue implementation in Codex and record the real session ID using `/status` in the thread where most substantial code work actually occurred. Describe only the work Codex really contributed.

## Final checklist
- [ ] Verify AI analysis using at least three actual Twitch messages.
- [ ] Test Twitch reconnect/failure handling and secure production auth design.
- [ ] Implement persistent shared case state and test the overlay in OBS Browser Source.
- [ ] Run `npm test`, `npm run build`, and `npm run lint`.
- [ ] Publish the complete source repository and run instructions.
- [ ] Perform substantial implementation in Codex and record the genuine `/status` session ID.
- [ ] Record a public YouTube demo shorter than 3 minutes with real Twitch behavior and Codex development footage.
- [ ] Replace this draft with final claims matching demonstrated behavior.
