// @ts-nocheck
/** Read only visible assistant prose from the supported Chat target snapshot. */
export function assistantMessages(snapshot) {
  const nodes = snapshot?.nodes?.values?.() || [];
  return [...nodes].filter(node => (node.kind === 'assistant-step' || node.kind === 'assistant') && node.visibility !== 'hidden').map(node => {
    const data = node.data;
    return {id: String(data.turn) + ':' + String(data.step), messageId: data.finalNode?.messageId,
      turn: data.turn, step:data.step, complete:data.status !== 'running', interrupted:data.status === 'interrupted',
      text:(data.blocks || []).filter(block => block.kind === 'text').map(block => block.text || '').join('')};
  }).sort((a,b) => a.turn-b.turn || a.step-b.step);
}
export function latestUserSequence(snapshot) {
  return Math.max(-1,...[...(snapshot?.nodes?.values?.() || [])].filter(node=>node.kind==='user' || node.kind==='steering').map(node=>Number(node.anchorSeq ?? node.data?.seq ?? -1)));
}
export function addressedTurn(messages,messageId) {
  const addressed=messages.find(message => String(message.messageId) === String(messageId));
  if(!addressed) return {text:'', ids:[]};
  return {text:addressed.text,id:addressed.id};
}
