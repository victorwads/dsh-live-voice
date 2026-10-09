# Voice Lifecycle and Turn-Taking Contract

This is the natural-language behavioral contract for conversation lifecycle and turn management. Code and tests should be reviewed against these rules.

## State scopes

### Persisted preferences

Engine, language, input/output device, Speakers/Headphones mode, delivery mode, delays, filters, and customized voice-command phrases survive conversations and reloads through the host-side `dsh-live-voice.settings` preferences. Browser storage is not read or written; legacy browser values are intentionally not migrated.

### Interruption sources

Shared meeting recognition publishes activity to the committed voice coordinator, separately from microphone activity. Either active source blocks queued speech; both must become silent before an automatically interrupted playback can resume. During playback, microphone interruption is limited to Headphones mode; shared participants can interrupt either output mode after qualifying non-echo recognition. Automatically paused audio resumes at its retained playback position after `assistantSpeechDelaySeconds` of uninterrupted silence. Renewed speech cancels that recovery countdown; final recognition also closes activity when no explicit activity-end event arrives. Explicit pause, cancel, segment navigation, or disposal prevents stale automatic recovery. Raw level/activity alone does not confirm an interruption, to avoid a feedback loop from assistant playback. Final-only recognition can confirm too late to interrupt the same short utterance. Browser own-tab/audio exclusion hints and a repeated-transcript guard reduce feedback, but cannot separate arbitrary mixed system audio acoustically.

### Application continuity

An explicit choice to keep voice conversation mode active may follow the committed composer across a chat route change. Shared meeting screen/audio capture is application-owned and stays active across navigation until an explicit stop, browser track end, page exit, or plugin disposal. Its transcript destination follows the committed composer; without one, no composer is modified. This continuity does not authorize session-owned queues or draft state to leak into the new composer.

### Per-session transient state

Soft mute, capture, recognition activity, partial transcript ownership, pending delivery countdowns, silence timers, queued playback, paused playback, temporary errors, abort controllers, and resource ownership belong to the current session. They must be reset or cancelled when that session ends or is replaced. In particular, a new voice session must not start soft-muted merely because the preceding session was muted.

### Per-operation state

Permission requests, engine starts, transcription requests, synthesis requests, and audio preparation each have their own cancellation generation. Results from an obsolete generation must not modify the current composer or playback queue.

## Independent states

Capture, recognition, user speech activity, message delivery, agent generation, synthesis, and playback are related but distinct. Mute is not stop. Pause is not cancel. Stopping speech must not silently stop recognition. Ending the conversation must release all voice resources.

## Turn-taking

- **Speakers:** playback gates recognition/capture so speaker output is not recognized. Manual interruption transfers ownership only after old playback teardown succeeds.
- **Headphones:** the microphone can remain open. Interruption requires qualifying transcript/activity rather than a single noise event.
- Spoken Send and Queue commands perform one delivery using their requested mode, without enabling, disabling, changing, or persisting the automatic-send preference. They cancel any pending countdown before that one-shot delivery.
- Automatic delivery starts only after final transcription and the configured quiet delay. New speech, edits, cancellation, or session replacement cancels a pending delivery.
- Automatic assistant playback waits for continuous silence and pending transcription/delivery work. Renewed speech restarts the delay. Manual per-message playback is not delayed.
- Sending a user message does not stop existing assistant playback unless the explicit interruption preference is enabled. Loaded history never counts as a new user turn.

## Lifecycle transitions

| Transition | Required result |
| --- | --- |
| Start input | Acquire current ownership; never inherit stale soft mute or transcript state |
| Ignoring (soft mute) | Discard microphone dictation and pending question answers; keep capture, activity, and interruption active regardless of voice-command preference. Enabled commands remain available. Shared meeting transcription is separate |
| Resume | Clear only the current session's soft mute |
| Stop input | Cancel starts, capture, recognition, partial hypotheses, and delivery timers |
| End conversation | Stop input and playback, clear queues/timers/transient errors, release ownership |
| Switch chat with voice mode active | Retire the old composer, cancel its operations, create clean transient state for the new composer |
| Settings change | Output/UI preferences preserve active playback, queue, and meeting capture; input preferences serialize only microphone/recognition replacement and restore input unless explicitly stopped. Current shared capture uses its start-time recognition settings until explicitly restarted |
| Unmount/dispose/pagehide | Invalidate pending work and release every owned resource |
| Late async result | Ignore it unless its session and operation generation are still current |

## Speech bar and approximate captions

The speech bar is separate from the recognition pill, with the same 52px pill geometry and shared buttons. It displays the active speech segment on one clipped line and owns playback pause/resume, next, stop and microphone takeover during speaker gating. Stop clears pending speech and closes the speech bar without ending voice conversation; pause preserves it. The recognition pill retains capture and delivery preferences. The automatic-speech toggle remains available in the composer between shared audio and microphone, even when there is no active playback; it is not duplicated in either bar.

Host-audio captions estimate character position from actual media currentTime/duration. Browser synthesis has no reliable duration, so its fallback estimates 14 characters/second adjusted by rate, starts only on the native start event and excludes paused time. Neither mode claims word alignment. Unknown duration keeps the full segment visible; cancelled/completed operations clear caption state. Session navigation retains the existing lifecycle semantics; this UI change does not implement the future global queue.

## Append-only dictation contract

Recognition is append-only at the end of the current composer. Only final recognized chunks are committed; provisional hypotheses affect recognition/activity status but never insert, replace, or remove composer text. Each final chunk appends after the latest published manual text, regardless of caret position. Appending must preserve the existing caret or selection (including its direction), keyboard focus, and composer scroll position; dictation must not move the caret to the appended text. Live Voice must not restore an older full-draft snapshot over a manual edit, even when React skips the exact echo of a previous voice write. Muting, cancellation, rejected short phrases, and voice-command recognition do not rewrite the composer. The explicit Clear command and ordinary user submission remain intentional exceptions; they are not dictation writes.

## Invariants

1. A new session never inherits soft mute.
2. Old recognition never writes into a new composer.
3. Cancelled or replaced playback never resumes itself.
4. Only the current owner may control shared hardware or host playback.
5. Failed teardown blocks unsafe replacement rather than overlapping resources.
6. End conversation leaves no capture, playback, countdown, queued transcript, or silence timer active.
7. Raw audio and transcript content are not logged by default.

These rules require regression tests where automation is possible and physical-device checks where browser permissions or hardware behavior cannot be simulated faithfully.
