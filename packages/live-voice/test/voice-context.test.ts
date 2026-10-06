// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultAgentVoiceContext, normalizeSettings } from '../src/modules/core/settings.ts';
import { createVoiceContextStore } from '../src/server.ts';

test('voice context defaults, supports customization, and rejects unsafe persisted input', () => {
  assert.equal(normalizeSettings({}).agentVoiceContext, defaultAgentVoiceContext);
  assert.equal(
    normalizeSettings({ agentVoiceContext: 'Speak briefly.' }).agentVoiceContext,
    'Speak briefly.',
  );
  assert.equal(
    normalizeSettings({ agentVoiceContext: 'bad\0context' }).agentVoiceContext,
    defaultAgentVoiceContext,
  );
  assert.equal(normalizeSettings({ agentVoiceContext: '' }).agentVoiceContext, '');
  assert.equal(normalizeSettings({}).agentVoiceContextEnabled, true);
  assert.equal(
    normalizeSettings({ agentVoiceContextEnabled: false }).agentVoiceContextEnabled,
    false,
  );
});

test('voice context store isolates sessions and removes inactive contexts', () => {
  const store = createVoiceContextStore();
  store.set('one', 'Context one');
  store.set('two', 'Context two');
  assert.equal(store.get('one'), 'Context one');
  assert.equal(store.get('two'), 'Context two');
  store.set('one', '');
  assert.equal(store.get('one'), '');
  assert.equal(store.get('two'), 'Context two');
  store.clear();
  assert.equal(store.get('two'), '');
});
