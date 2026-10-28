# CrowdCase — video script (target 2:40; must be under 3:00)

**Recording rules:** Use the real Twitch channel and current app. Show the cursor/interaction, not just static screenshots. Keep the video public on YouTube. Never show access tokens, OAuth URLs containing tokens, Client Secrets, passwords, or API keys.

## 0:00–0:15 — Hook
**Show:** CrowdCase dashboard, then the title “The Midnight Gallery Heist.”

**Read:** “What if Twitch chat wasn't just watching the stream, but solving the mystery together? This is CrowdCase: The Chat Is the Detective.”

## 0:15–0:35 — The case
**Show:** Evidence board, suspects, the stopped clock clue and the 47-second blackout timeline.

**Read:** “A priceless clockwork bird disappeared during a blackout. Viewers inspect clues, compare suspects, and build a theory together while the streamer controls how the story unfolds.”

## 0:35–1:00 — Real Twitch connection
**Show:** The actual Twitch channel and CrowdCase Settings showing a connected state. Send a real `!theory` message in chat, then show that message arriving in CrowdCase Live chat.

**Read:** “CrowdCase connects to Twitch through OAuth and EventSub. Here I'm sending a real chat theory, and you can see the same message arrive in the investigation dashboard.”

## 1:00–1:30 — AI Case Intelligence
**Show:** Three or more real Twitch messages, then **Live Case → Intelligence → Analyze chat**. Keep the result visible long enough to see source-message names and counterpoint.

**Read if the UI displays AI ANALYSIS:** “The AI analysis summarizes the leading community hypothesis, groups related ideas, cites the chat messages behind its conclusions, and includes a counterpoint. It's a way to understand chat, not a verdict on a suspect.”

**Read instead if the UI displays HEURISTIC FALLBACK:** “In this run the model service was unavailable, so CrowdCase clearly labels a heuristic fallback built from viewer-submitted theories. It does not pretend that fallback is an AI response.”

## 1:30–1:55 — Community gameplay
**Show:** Start a vote, enter a valid `!vote curator` (or the exact unique theory term) in the Twitch chat, show the dashboard count change, then reveal the next clue.

**Read:** “Viewers can vote while a round is open, and the app rejects duplicate or ambiguous chat votes rather than silently assigning them to the wrong theory. The streamer can reveal the next clue to move the mystery forward.”

## 1:55–2:20 — Codex and engineering
**Show:** The actual Codex build thread with a meaningful code change, then GitHub Actions passing tests, build and lint. Do not show only a blank Codex window or merely the repository page.

**Read:** “I used Codex to iterate on the implementation and debug the project. The repository includes automated checks for chat commands, theory matching, vote validation, source attribution and duplicate-event handling.”

Only keep the last sentence if it accurately describes the work performed in your Codex thread.

## 2:20–2:40 — Close
**Show:** Return to dashboard and briefly show the repository URL.

**Read:** “CrowdCase turns a stream into a shared investigation: chat doesn't just react to the story — it helps move it forward.”

## Before publishing
- Verify the video runs under 3:00 after editing.
- Keep only the AI narration matching the actual result shown.
- Show actual Codex development and use the genuine session ID from `/status`.
- Upload to YouTube and set visibility to Public.
