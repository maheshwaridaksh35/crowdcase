import { normalizeTheory } from "./theory-engine.js";

export function validateChatVote({ votingOpen, username, term, theories, votedUsernames }) {
  if (!votingOpen) return { status: "closed" };

  const userKey = String(username ?? "").trim().toLowerCase();
  const candidate = String(term ?? "").trim().toLowerCase();
  if (!userKey || candidate.length < 3) return { status: "invalid" };

  const alreadyVoted = votedUsernames instanceof Set
    ? votedUsernames.has(userKey)
    : Array.isArray(votedUsernames) && votedUsernames.includes(userKey);
  if (alreadyVoted) return { status: "already-voted" };

  const available = theories ?? [];
  const normalizedCandidate = normalizeTheory(candidate);
  let theory = available.find((item) =>
    String(item.id).toLowerCase() === candidate ||
    normalizeTheory(item.title) === normalizedCandidate ||
    String(item.by ?? "").trim().toLowerCase() === candidate
  );

  // Allow readable partial names only when they identify exactly one theory.
  // This prevents a short or common word from silently voting for the first match.
  if (!theory && candidate.length >= 4) {
    const matches = available.filter((item) => item.title.toLowerCase().includes(candidate));
    if (matches.length === 1) theory = matches[0];
    else return { status: "invalid" };
  }
  if (!theory) return { status: "invalid" };

  return { status: "ok", theoryId: theory.id, title: theory.title, username: userKey };
}
