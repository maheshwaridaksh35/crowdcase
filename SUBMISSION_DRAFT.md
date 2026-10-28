# CrowdCase — Devpost submission copy

## Project name
CrowdCase: The Chat Is the Detective

## Elevator pitch
Turn Twitch chat into a detective team: viewers submit theories, vote on suspects, and help a streamer unravel a live mystery.

## Project description
CrowdCase turns a Twitch stream into a collaborative detective mystery. In The Midnight Gallery Heist, viewers examine clues, submit theories, and vote on possible explanations while the streamer reveals evidence and advances the story.

CrowdCase connects to Twitch chat through OAuth and EventSub WebSocket. Messages arrive in the dashboard, where chat commands such as `!theory`, `!vote`, and `!clue` drive the investigation. The streamer can reveal clues and move the story between chapters. A separate overlay preview is available for stream presentation.

The AI Case Intelligence feature is designed to analyze recent real Twitch chat, summarize the leading community hypothesis, group related theories, provide a counterpoint, and reference the source messages behind its output. If the AI service is unavailable, CrowdCase explicitly labels a heuristic fallback rather than pretending that a model response was produced. AI output is an interpretation of chat, not proof of guilt.

This is a working prototype, not a production multiplayer platform: voting and case state are local to the dashboard session, and the overlay's current synchronization is a same-origin browser preview rather than a tested cross-device OBS transport.

## Built with
OpenAI Codex, React, TanStack Start/Router, Vite, Twitch OAuth/EventSub WebSocket, TanStack AI, Zod, Base44 AI gateway, GitHub Actions.

## How Codex was used
I used OpenAI Codex during development to iterate on the React/TanStack application, work through implementation and debugging, and refine the Twitch chat and community-mystery workflow. I used automated tests and the GitHub Actions pipeline to check command parsing, theory matching, vote validation, source-message guardrails, event deduplication, and the production build.

Before submitting, make sure this accurately describes the work Codex performed in your primary build thread. Do not attribute work to Codex that was done elsewhere.

## Links to add in the Devpost form
- **Code repository:** https://github.com/maheshwaridaksh35/crowdcase
- **Live demo:** https://crowd-case-the-chat-is-the-detecti-e9dc35a0.base44.app
- **Overlay preview:** https://crowd-case-the-chat-is-the-detecti-e9dc35a0.base44.app/overlay
- **Demo video:** Add the public YouTube URL after recording.
- **Codex session ID:** Paste the exact ID shown by `/status` in the thread where most of the project was built.

## Final check before clicking Submit
- [ ] The live Twitch-to-AI workflow is tested with actual Twitch messages; the video shows the real result mode.
- [ ] The public repository contains the same source used for the demo and setup instructions.
- [ ] The public YouTube video is shorter than 3 minutes and shows both the running Twitch project and genuine Codex development.
- [ ] The Codex session ID is copied from `/status`, not guessed.
- [ ] The Devpost status reads **Submitted**, not merely Draft.
