import test from 'node:test';
import assert from 'node:assert/strict';
import { CLIENT_SLOT_DEFINITIONS, SETTINGS_SLOT } from '../src/app/client/slotDefinitions.ts';

test('app client preserves every established DSH slot contract', () => {
  assert.deepEqual(SETTINGS_SLOT, { name: 'settings.section', id: 'dsh-live-voice', order: 65 });
  assert.deepEqual(CLIENT_SLOT_DEFINITIONS, [
    { name: 'conversation.input.right', id: 'live-voice-controls', order: 6, component: 'Buttons' },
    { name: 'conversation.input.dock', id: 'live-voice-status', order: -100, component: 'Dock' },
    {
      name: 'conversation.session.header.utilities',
      id: 'live-voice-question-status',
      order: 100,
      component: 'QuestionStatus',
    },
    {
      name: 'conversation.chat.assistant-actions',
      id: 'live-voice-speak',
      order: 5,
      component: 'Action',
    },
  ]);
});
