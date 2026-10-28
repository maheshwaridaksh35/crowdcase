# CrowdCase — Devpost form draft

## Project name
CrowdCase: The Chat Is the Detective

## Elevator pitch
A Twitch mystery where chat investigates together: viewers submit theories, vote on suspects, and unlock new evidence as the streamer advances the case.

## Project description (update after your final end-to-end test)
CrowdCase turns a livestream into a collaborative mystery. In The Midnight Gallery Heist, viewers examine clues, propose explanations and vote on leading theories while the streamer controls clue reveals and story chapters. A dedicated overlay is designed to make the community's investigation visible on stream.

The app includes a responsive evidence board, suspect profiles, a case timeline, a theory tracker, clue reveal and chapter controls. Twitch chat ingestion through OAuth and EventSub WebSocket was verified with a real message reaching CrowdCase. Chat commands can currently update local dashboard session state, but shared persistent voting and production OBS synchronization remain incomplete.

A server-side AI theory-analysis path is implemented with structured output, source-message references restricted to supplied message IDs, and guardrails against unsupported accusations. A direct smoke test returned structured AI output using synthetic test messages; the full dashboard path using real Twitch messages still needs testing. Verify that path before claiming it works. If it falls back, describe the deterministic heuristic fallback accurately instead.

## Built with (confirm final stack)
React, TanStack Start/Router, Vite, Lucide, Twitch OAuth/EventSub WebSocket, TanStack AI, Zod, Base44 AI gateway.

## How Codex was used
Complete only after genuine Codex development. This initial dashboard was built in an app-building workspace. Open it in Codex and implement meaningful features in a Codex thread; record the actual session ID using /status. Describe the real Codex contribution and do not claim Codex built code it did not build.

## Final checklist
- [ ] Run and document Analyze chat with at least 3 actual Twitch messages.
- [ ] Harden auth and token handling, test reconnect/failure modes.
- [ ] Implement shared case state and test the overlay in actual OBS Browser Source.
- [ ] Add remaining integration tests; npm test, build, lint all pass.
- [ ] Publish the complete code to a public/eligible GitHub, GitLab or Bitbucket repo.
- [ ] Use Codex for substantial development and retain the genuine /status session ID.
- [ ] Record a public YouTube demo under 3 minutes with real Twitch behavior and Codex footage.
- [ ] Replace this draft with final verified results and attach the real repository, video, and session ID.
