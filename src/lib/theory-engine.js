export function parseChatCommand(input) {
  const text = String(input ?? "").trim().slice(0, 300);
  const match = text.match(/^!(theory|vote|clue)\b(?:\s+([\s\S]*))?$/i);
  if (!match) return { type: "chat", argument: "", text };
  return { type: match[1].toLowerCase(), argument: (match[2] ?? "").trim().slice(0, 280), text };
}
const STOP_WORDS = new Set(["a","an","the","and","or","but","to","of","that","this","was","were","is","are","in","on","at","with","use","used","using","had","has","have","for","from","by","as","it","its","they","them","their","someone","maybe","think","what","if"]);
export function normalizeTheory(input) {
  return String(input ?? "").replace(/^!theory\s*/i,"").normalize("NFKD").toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(word=>word.length>1&&!STOP_WORDS.has(word)).sort().join(" ");
}
function jaccardSimilarity(left,right) {
 const a=new Set(normalizeTheory(left).split(" ").filter(Boolean)),b=new Set(normalizeTheory(right).split(" ").filter(Boolean));
 if(!a.size||!b.size)return 0;let shared=0;for(const word of a)if(b.has(word))shared++;
 return shared/(a.size+b.size-shared);
}
export function findSimilarTheory(theories,submittedText,threshold=0.7) {
 const normalized=normalizeTheory(submittedText);if(!normalized)return null;
 return theories.find(theory=>{const existing=normalizeTheory(theory.title);return existing===normalized||jaccardSimilarity(existing,normalized)>=threshold;})??null;
}