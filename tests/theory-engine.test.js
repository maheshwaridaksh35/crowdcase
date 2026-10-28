import test from "node:test";
import assert from "node:assert/strict";
import { findSimilarTheory, normalizeTheory, parseChatCommand } from "../src/lib/theory-engine.js";
import { guardLeadingTheory, retainKnownSourceReferences } from "../src/lib/ai-validation.js";
import { validateChatVote } from "../src/lib/vote-engine.js";
import { rememberEventId } from "../src/lib/message-idempotency.js";

test("normalization removes command prefix, punctuation, and filler words", () => {
  assert.equal(
    normalizeTheory("!theory The curator used the blackout to unlock the case!"),
    "blackout case curator unlock",
  );
});

test("chat command parser recognizes theory, vote, and clue", () => {
  assert.deepEqual(parseChatCommand("!theory Mira had the spare key"), {
    type: "theory",
    argument: "Mira had the spare key",
    text: "!theory Mira had the spare key",
  });
  assert.equal(parseChatCommand("!vote curator").type, "vote");
  assert.equal(parseChatCommand("!clue").type, "clue");
  assert.equal(parseChatCommand("ordinary chat message").type, "chat");
});

test("command parser does not match command prefixes inside unrelated words", () => {
  assert.equal(parseChatCommand("!theories are fun").type, "chat");
  assert.equal(parseChatCommand("!voter is here").type, "chat");
});

test("similar theory matching groups reordered equivalent theories", () => {
  const theories = [{ id: "curator", title: "The curator used the blackout to unlock the case" }];
  assert.equal(
    findSimilarTheory(theories, "!theory to unlock the case the curator used the blackout")?.id,
    "curator",
  );
});

test("similar theory matching does not merge unrelated theories", () => {
  const theories = [{ id: "window", title: "The thief entered through the gallery window" }];
  assert.equal(findSimilarTheory(theories, "Mira distracted the guard with a blue cloth"), null);
});

test("AI source validation strips unknown IDs and drops unsupported claims", () => {
  const safe = retainKnownSourceReferences({
    evidence: [
      { claim: "supported", sourceMessageIds: ["m1", "invented"] },
      { claim: "unreferenced", sourceMessageIds: ["invented"] },
    ],
    theoryGroups: [
      { title: "supported group", sourceMessageIds: ["m2", "invented"] },
      { title: "unsupported group", sourceMessageIds: [] },
    ],
    leadingTheorySourceMessageIds: ["m2", "invented"],
  }, new Set(["m1", "m2"]));
  assert.deepEqual(safe.evidence, [{ claim: "supported", sourceMessageIds: ["m1"] }]);
  assert.deepEqual(safe.theoryGroups, [{ title: "supported group", sourceMessageIds: ["m2"] }]);
  assert.deepEqual(safe.leadingTheorySourceMessageIds, ["m2"]);
});

test("EventSub duplicate IDs are ignored and the seen-ID set remains bounded", () => {
  const seen = new Set();
  assert.equal(rememberEventId("event-1", seen), true);
  assert.equal(rememberEventId("event-1", seen), false);
  assert.equal(rememberEventId("event-2", seen), true);
  assert.deepEqual([...seen], ["event-1", "event-2"]);
  assert.equal(rememberEventId(null, seen), true);
  rememberEventId("event-3", seen, 2);
  assert.deepEqual([...seen], ["event-2", "event-3"]);
});

test("AI leading theory labels speculation and filters unsupported accusations", () => {
  assert.equal(
    guardLeadingTheory("The blue fiber implicates Mira in the theft.", ["m1"]),
    "Chat is discussing an unverified hypothesis about possible suspect involvement. Review the cited messages and counterargument.",
  );
  assert.equal(
    guardLeadingTheory("The blue fiber connects Mira to the theft.", ["m1"]),
    "Chat is discussing an unverified hypothesis about possible suspect involvement. Review the cited messages and counterargument.",
  );
  assert.equal(
    guardLeadingTheory("The curator altered the timeline", ["m2"]),
    "Unverified chat hypothesis: The curator altered the timeline",
  );
  assert.equal(
    guardLeadingTheory("Mira is the primary suspect", []),
    "There is not enough source-grounded chat signal to select a leading theory yet.",
  );
});

test("chat vote validation handles closed polls, missing candidates, duplicates, and valid votes", () => {
  const theories = [
    { id: "curator", title: "The curator used the blackout to unlock the case", by: "orbitalsoup" },
    { id: "window", title: "The thief entered through the gallery window", by: "lunarbyte" },
  ];
  const common = { username: "ViewerOne", theories, votedUsernames: new Set() };
  assert.equal(validateChatVote({ ...common, votingOpen: false, term: "curator" }).status, "closed");
  assert.equal(validateChatVote({ ...common, votingOpen: true, term: "" }).status, "invalid");
  assert.equal(validateChatVote({ ...common, votingOpen: true, term: "not-a-theory" }).status, "invalid");
  assert.equal(validateChatVote({ ...common, votingOpen: true, term: "curator", votedUsernames: new Set(["viewerone"]) }).status, "already-voted");
  assert.deepEqual(
    validateChatVote({ ...common, votingOpen: true, term: "curator" }),
    { status: "ok", theoryId: "curator", title: theories[0].title, username: "viewerone" },
  );
});
