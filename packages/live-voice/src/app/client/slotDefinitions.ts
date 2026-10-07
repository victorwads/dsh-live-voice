export const SETTINGS_SLOT = Object.freeze({
  name: 'settings.section',
  id: 'dsh-live-voice',
  order: 65,
});
export const CLIENT_SLOT_DEFINITIONS = Object.freeze([
  Object.freeze({
    name: 'conversation.input.right',
    id: 'live-voice-controls',
    order: 6,
    component: 'Buttons',
  }),
  Object.freeze({
    name: 'conversation.input.dock',
    id: 'live-voice-status',
    order: -100,
    component: 'Dock',
  }),
  Object.freeze({
    name: 'conversation.session.header.utilities',
    id: 'live-voice-question-status',
    order: 100,
    component: 'QuestionStatus',
  }),
  Object.freeze({
    name: 'conversation.chat.assistant-actions',
    id: 'live-voice-speak',
    order: 5,
    component: 'Action',
  }),
]);
export type ClientSlotDefinition = (typeof CLIENT_SLOT_DEFINITIONS)[number];
