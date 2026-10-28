const unsupportedAccusation = /\b(guilty|primary suspect|definitely stole|stole|implicat(?:e|es|ed|ing)|is the thief|committed the theft|responsible for the theft|culprit is)\b|\b(connects?|links?|ties?)\b.{0,60}\bto (?:the )?(?:theft|crime|heist)\b/i;

export function guardLeadingTheory(leadingTheory, sourceMessageIds) {
  const text=String(leadingTheory??"").trim().slice(0,220);
  if(!text||!sourceMessageIds?.length)return "There is not enough source-grounded chat signal to select a leading theory yet.";
  if(unsupportedAccusation.test(text))return "Chat is discussing an unverified hypothesis about possible suspect involvement. Review the cited messages and counterargument.";
  if(/^(chat is considering|the strongest chat hypothesis is|there is not enough reliable signal)/i.test(text))return text;
  return "Unverified chat hypothesis: "+text;
}
export function retainKnownSourceReferences(result,allowedIds) {
  const allowed=allowedIds instanceof Set?allowedIds:new Set(allowedIds??[]);
  const evidence=(result.evidence??[]).map(item=>({...item,sourceMessageIds:(item.sourceMessageIds??[]).filter(id=>allowed.has(id))})).filter(item=>item.sourceMessageIds.length>0);
  const theoryGroups=(result.theoryGroups??[]).map(item=>({...item,sourceMessageIds:(item.sourceMessageIds??[]).filter(id=>allowed.has(id))})).filter(item=>item.sourceMessageIds.length>0);
  const leadingTheorySourceMessageIds=(result.leadingTheorySourceMessageIds??[]).filter(id=>allowed.has(id));
  return {evidence,theoryGroups,leadingTheorySourceMessageIds};
}