import test from 'node:test';
import assert from 'node:assert/strict';
import {
  groupBrowserVoices,
  rankBrowserVoices,
  preferredBrowserVoice,
  speechEngineSelectionPatch,
} from '../src/modules/settings/models/browserVoiceSelection.ts';

const voices = Object.freeze([
  Object.freeze({ name: 'Z natural', voiceURI: 'pt-natural', lang: 'pt_BR' }),
  Object.freeze({ name: 'A (Natural)', voiceURI: 'en-natural', lang: 'en-US' }),
  Object.freeze({ name: 'B', voiceURI: 'pt-standard', lang: 'pt-PT' }),
  Object.freeze({ name: 'A', voiceURI: 'en-standard', lang: 'en-US' }),
  Object.freeze({ name: 'Unnatural', voiceURI: 'unknown' }),
]);

test('Natural precedes language family and alphabetical order without mutating inputs', () => {
  assert.deepEqual(
    rankBrowserVoices(voices, 'PT-br').map((v) => v.voiceURI),
    ['pt-natural', 'en-natural', 'pt-standard', 'en-standard', 'unknown'],
  );
  assert.equal(voices[0].voiceURI, 'pt-natural');
  assert.notEqual(rankBrowserVoices(voices), voices);
});

test('missing languages do not match or throw; ties use alphabetical names', () => {
  assert.deepEqual(
    rankBrowserVoices(voices).map((v) => v.voiceURI),
    ['en-natural', 'pt-natural', 'en-standard', 'pt-standard', 'unknown'],
  );
  assert.deepEqual(rankBrowserVoices([], ''), []);
});

test('preferred natural default respects browser language and URI/name fallback', () => {
  assert.equal(preferredBrowserVoice(voices, 'pt-BR'), 'pt-natural');
  assert.equal(preferredBrowserVoice(voices, 'en-GB'), 'en-natural');
  assert.equal(preferredBrowserVoice([{ name: 'Natural', lang: 'pt' }], 'pt'), 'Natural');
  assert.equal(preferredBrowserVoice([{ name: 'Standard' }]), undefined);
  assert.equal(preferredBrowserVoice([]), undefined);
});

test('language sections prioritize browser language, rank Natural inside groups, and keep unknown last', () => {
  const groups = groupBrowserVoices(voices, 'pt-BR');
  assert.deepEqual(
    groups.map((group) => group.language),
    ['pt', 'en', ''],
  );
  assert.deepEqual(
    groups.map((group) => group.voices.map((voice) => voice.voiceURI)),
    [['pt-natural', 'pt-standard'], ['en-natural', 'en-standard'], ['unknown']],
  );
  assert.deepEqual(groupBrowserVoices([], 'pt'), []);
  assert.deepEqual(
    groupBrowserVoices(voices).map((group) => group.language),
    ['en', 'pt', ''],
  );
});

test('defaults are only chosen on explicit transitions to Browser', () => {
  assert.deepEqual(speechEngineSelectionPatch('say', 'browser', voices, 'pt'), {
    engine: 'browser',
    voice: 'pt-natural',
  });
  assert.deepEqual(speechEngineSelectionPatch('browser', 'browser', voices, 'pt'), {
    engine: 'browser',
  });
  assert.deepEqual(speechEngineSelectionPatch('browser', 'say', voices, 'pt'), { engine: 'say' });
  assert.deepEqual(speechEngineSelectionPatch('say', 'browser', []), { engine: 'browser' });
});
