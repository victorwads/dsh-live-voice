const notices: Record<string, string> = {
  en: 'You can see the code in our conversation history.',
  pt: 'Você pode ver o código no histórico da nossa conversa.',
  es: 'Puedes ver el código en el historial de nuestra conversación.',
  fr: 'Vous pouvez voir le code dans l’historique de notre conversation.',
  hi: 'आप हमारी बातचीत के इतिहास में कोड देख सकते हैं।',
  zh: '你可以在我们的对话历史中查看代码。',
};
const defaults = new Set([
  ...Object.values(notices),
  'Look the code on out conversation',
  'You can see the code on our conversation history.',
  'You can see the code on our conversation history',
]);
/** Default notices follow TTS language; explicit custom notices remain unchanged. */
export function resolveCodeNotice(value: unknown, lang = 'en') {
  const text = typeof value === 'string' ? value.trim() : '';
  return !text || defaults.has(text)
    ? notices[String(lang).toLowerCase().split('-')[0]] || notices.en
    : text;
}
