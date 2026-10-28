export function rememberEventId(eventId, seenIds, limit=5000) {
  if(eventId==null||String(eventId).trim()==="")return true;
  const id=String(eventId);if(seenIds.has(id))return false;seenIds.add(id);
  while(seenIds.size>limit){const oldest=seenIds.values().next().value;if(oldest===undefined)break;seenIds.delete(oldest);}
  return true;
}