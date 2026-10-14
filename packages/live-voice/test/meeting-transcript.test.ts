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
  assert.equal(draft, 'Solo First Second\n\nThem: Other More\n\nMe: Back');
  draft = 'Manual edit';
  transcript.append('microphone', 'After edit');
  assert.equal(draft, 'Manual edit After edit');
  transcript.setActive('shared', false);
  transcript.append('shared', 'Stale');
  transcript.append('microphone', 'Only source');
  assert.equal(draft, 'Manual edit After edit Only source');
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
    'Me: No stamp\n\n[2026/10/07 05:43:25] Them: First Continuation\n\n[2026/10/07 05:43:35] Me: Next',
  );
  transcript.setTimestamps(false);
  transcript.append('shared', 'No more timestamps', onset);
  assert.ok(draft.endsWith('\n\nThem: No more timestamps'));
});

test('paragraphs refresh timestamps while ordinary chunks and manual edits stay on the same line', () => {
  let draft = '';
  const transcript = new MeetingTranscript({
    getDraft: () => draft,
    setDraft: (value) => {
      draft = value;
    },
  });
  transcript.setActive('microphone', true);
  transcript.setTimestamps(true);
  const onset = new Date(2026, 9, 14, 17, 0, 0).getTime();
  transcript.append('microphone', 'First', onset);
  transcript.setActive('microphone', true);
  transcript.append('microphone', 'continuation', onset + 1000);
  draft += ' manual';
  transcript.append('microphone', 'still same paragraph', onset + 2000);
  transcript.append('microphone', 'Second paragraph', onset + 5000, true);
  transcript.append('microphone', 'continued', onset + 6000);
  assert.equal(
    draft,
    '[2026/10/14 17:00:00] First continuation manual still same paragraph\n\n[2026/10/14 17:00:05] Second paragraph continued',
  );
});

test('custom source names affect new blocks without rewriting existing text', () => {
  let draft = '';
  let settings = { microphoneSourceName: 'Alice', sharedSourceName: '团队' };
  const transcript = new MeetingTranscript(
    {
      getDraft: () => draft,
      setDraft: (text) => {
        draft = text;
      },
    },
    () => settings,
  );
  transcript.setActive('microphone', true);
  transcript.append('microphone', 'Solo');
  assert.equal(draft, 'Solo');
  transcript.setActive('shared', true);
  transcript.append('microphone', 'First');
  transcript.append('shared', 'Other');
  settings = { microphoneSourceName: 'Bob', sharedSourceName: 'Team' };
  transcript.append('shared', 'Continuation');
  assert.equal(draft, 'Solo First\n\n团队: Other Continuation');
  transcript.setTimestamps(true);
  const onset = new Date(2026, 9, 7, 5, 43, 25).getTime();
  transcript.append('shared', 'New block', onset, true);
  assert.ok(draft.endsWith('\n\n[2026/10/07 05:43:25] Team: New block'));
  draft = 'Manual edit';
  transcript.setTimestamps(false);
  transcript.append('microphone', 'After edit');
  assert.equal(draft, 'Manual edit\n\nBob: After edit');
});
