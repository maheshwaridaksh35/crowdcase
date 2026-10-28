export function validateChatVote({ votingOpen, username, term, theories, votedUsernames }) {
  if (!votingOpen) return { status: "closed" };
  const userKey = String(username ?? "").trim().toLowerCase();
  const candidate = String(term ?? "").trim().toLowerCase();
  if (!userKey || !candidate) return { status: "invalid" };
  const alreadyVoted = votedUsernames instanceof Set
    ? votedUsernames.has(userKey)
    : Array.isArray(votedUsernames) && votedUsernames.includes(userKey);
  if (alreadyVoted) return { status: "already-voted" };
  const theory = (theories ?? []).find((item) =>
    item.id === candidate ||
    item.title.toLowerCase().includes(candidate) ||
    item.by.toLowerCase() === candidate
  );
  if (!theory) return { status: "invalid" };
  return { status: "ok", theoryId: theory.id, title: theory.title, username: userKey };
}
