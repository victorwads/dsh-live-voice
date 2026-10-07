import test from 'node:test';
import assert from 'node:assert/strict';
import { MeetingTranscript } from '../src/modules/conversation/models/meetingTranscript.js';

test('meeting composer merges final chunks by source and preserves manual edits', () => {
  let draft = '';
  const transcript = new MeetingTranscript({
    getDraft: () => draft,
    setDraft: (value) => {
      draft = value;
    },
  });
  transcript.setActive('microphone', true);
  transcript.append('microphone', 'Solo');
  assert.equal(draft, 'Solo');
  transcript.setActive('shared', true);
  transcript.append('microphone', 'First');
  transcript.append('microphone', 'Second');
  transcript.append('shared', 'Other');
  transcript.append('shared', 'More');
  transcript.append('microphone', 'Back');
  assert.equal(draft, 'Solo\n\nMe: First\nSecond\n\nThem: Other\nMore\n\nMe: Back');
  draft = 'Manual edit';
  transcript.append('microphone', 'After edit');
  assert.equal(draft, 'Manual edit\n\nMe: After edit');
  transcript.setActive('shared', false);
  transcript.append('shared', 'Stale');
  transcript.append('microphone', 'Only source');
  assert.equal(draft, 'Manual edit\n\nMe: After edit\nOnly source');
});

test('timestamps use local chunk onset on source changes, default off, without rewriting previous text', () => {
  let draft = '';
  const transcript = new MeetingTranscript({
    getDraft: () => draft,
    setDraft: (value) => {
      draft = value;
    },
  });
  transcript.setActive('microphone', true);
  transcript.setActive('shared', true);
  const onset = new Date(2026, 9, 7, 5, 43, 25).getTime();
  transcript.append('microphone', 'No stamp', onset);
  assert.equal(draft, 'Me: No stamp');
  transcript.setTimestamps(true);
  transcript.append('shared', 'First', onset);
  transcript.append('shared', 'Continuation', onset + 2000);
  transcript.append('microphone', 'Next', onset + 10000);
  assert.equal(
    draft,
    'Me: No stamp\n\n[2026/10/07 05:43:25] Them: First\nContinuation\n\n[2026/10/07 05:43:35] Me: Next',
  );
  transcript.setTimestamps(false);
  transcript.append('shared', 'No more timestamps', onset);
  assert.ok(draft.endsWith('\n\nThem: No more timestamps'));
});
