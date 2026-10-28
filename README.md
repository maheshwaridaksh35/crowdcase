# CrowdCase — The chat is the detective

CrowdCase is an interactive community-mystery concept for Twitch creators. A streamer hosts the fictional mystery **The Midnight Gallery Heist** while viewers submit theories, vote, and inspect clues.

## Live demo

- Dashboard: https://crowd-case-the-chat-is-the-detecti-e9dc35a0.base44.app
- Overlay preview: https://crowd-case-the-chat-is-the-detecti-e9dc35a0.base44.app/overlay

## Features in the current deployed prototype

- Responsive creator dashboard with an evidence board, suspects, story timeline, chapter and clue controls, case library, Settings, and Insights.
- Twitch OAuth/EventSub WebSocket connector for the channel account that authorizes the application.
- Real Twitch chat messages displayed in Live chat. The owner manually verified a real message appearing in CrowdCase.
- Chat commands: `!theory`, `!vote`, and `!clue`. Their effects currently update local dashboard state; this is not yet a persistent multiplayer backend.
- Deterministic theory matching and local vote validation.
- Server-side AI analysis path through the Base44 AI gateway. A direct smoke test with synthetic messages returned structured output and source-message IDs. The complete dashboard flow using actual Twitch messages still requires a manual check.
- Separate `/overlay` preview.
- Nine automated unit tests for command parsing, theory matching, vote validation, EventSub deduplication and AI source-reference guardrails.

## Verification status

Verified in the maintained app workspace on 28 October 2026:

- `npm test`: 9 tests passed.
- `npm run build`: passed.
- `npm run lint`: passed.
- `/` and `/overlay` both returned HTTP 200.
- Real Twitch chat ingestion was manually verified by the project owner.
- AI analysis succeeded in a direct server smoke test with synthetic input. This does not, by itself, verify the dashboard's live-chat-to-AI workflow.

## Run locally

Use Node.js LTS:

```bash
npm install
npm run dev
npm test
npm run build
npm run lint
```

Routes:
- `/` — creator dashboard
- `/overlay` — overlay preview

Stack: React, TanStack Start/Router, Vite, Lucide, TanStack AI, Zod, and the Base44 AI gateway.

## Connect Twitch

1. Register an application at https://dev.twitch.tv/console/apps.
2. Add the exact redirect URI shown in CrowdCase Settings.
3. Enter the public Client ID and the login of the account authorizing the app.
4. Click **Authorize Twitch chat** and approve `user:read:chat`.
5. Send a real message and verify that it appears in CrowdCase Live chat.

Never commit or share a Twitch Client Secret, access token or private API key. The current browser connector uses a prototype implicit-token flow and has no refresh-token flow. It is not a production authentication architecture; production use needs a supported server-managed OAuth/session design.

## AI analysis and safety

- The AI path accepts 3–40 messages supplied by the dashboard.
- The model is instructed to treat chat as untrusted content and distinguish hypotheses from fictional case facts.
- Outputs include source-message IDs; the server filters IDs against the submitted messages and drops unsupported source references.
- Unsupported accusatory wording is downgraded to explicitly unverified hypothesis language.
- The per-runtime in-memory rate limiter is a prototype guardrail, not production-grade shared rate limiting.
- AI output is an interpretation of chat, not proof of guilt or verified evidence.

## Overlay limitations

The dashboard and overlay prototype use `BroadcastChannel` and `localStorage` for synchronization between compatible same-origin browser tabs. That is not a reliable shared transport across independent OBS Browser Source contexts, devices, or sessions. Persistent shared case state and an authenticated WebSocket/SSE transport still need implementation and OBS testing.

## Competition completion checklist

1. Continue substantial development in OpenAI Codex. This initial prototype was created in an app-building workspace.
2. In the Codex thread where most of the project work was actually done, run `/status` and record the real session ID. Never invent one.
3. Verify **Live Case → Intelligence → Analyze chat** using at least three actual Twitch messages. Record whether it returns `AI ANALYSIS` or the explicitly labelled fallback.
4. Implement/test persistent shared state and the intended OBS overlay transport.
5. Add integration tests for OAuth failure/expiry, EventSub reconnect/revocation, voting, source attribution and secret leakage.
6. Publish the full runnable source here and verify the repository's default branch contains the tested version.
7. Record a public YouTube demo under three minutes showing real Twitch behavior and genuine Codex development; see `DEMO_SCRIPT.md`.
8. Update `SUBMISSION_DRAFT.md` to match only behavior actually demonstrated.

This is a working prototype milestone, not a finished submission or a guarantee of winning. Do not claim features that have not been demonstrated.
