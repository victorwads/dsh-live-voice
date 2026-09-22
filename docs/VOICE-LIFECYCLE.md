# Voice Lifecycle and Turn-Taking Contract

This is the natural-language behavioral contract for conversation lifecycle and turn management. Code and tests should be reviewed against these rules.

## State scopes

### Persisted preferences

Engine, language, input/output device, Speakers/Headphones mode, delivery mode, delays, filters, and customized voice-command phrases may survive conversations and reloads through `dsh-live-voice.settings`.

### Application continuity

An explicit choice to keep voice conversation mode active may follow the committed composer across a chat route change. This continuity does not authorize transient operational state to leak into the new composer.

### Per-session transient state

Soft mute, capture, recognition activity, partial transcript ownership, pending delivery countdowns, silence timers, queued playback, paused playback, temporary errors, abort controllers, and resource ownership belong to the current session. They must be reset or cancelled when that session ends or is replaced. In particular, a new voice session must not start soft-muted merely because the preceding session was muted.

### Per-operation state

Permission requests, engine starts, transcription requests, synthesis requests, and audio preparation each have their own cancellation generation. Results from an obsolete generation must not modify the current composer or playback queue.

## Independent states

Capture, recognition, user speech activity, message delivery, agent generation, synthesis, and playback are related but distinct. Mute is not stop. Pause is not cancel. Stopping speech must not silently stop recognition. Ending the conversation must release all voice resources.

## Turn-taking

- **Speakers:** playback gates recognition/capture so speaker output is not recognized. Manual interruption transfers ownership only after old playback teardown succeeds.
- **Headphones:** the microphone can remain open. Interruption requires qualifying transcript/activity rather than a single noise event.
- Automatic delivery starts only after final transcription and the configured quiet delay. New speech, edits, cancellation, or session replacement cancels a pending delivery.
- Automatic assistant playback waits for continuous silence and pending transcription/delivery work. Renewed speech restarts the delay. Manual per-message playback is not delayed.
- Sending a user message does not stop existing assistant playback unless the explicit interruption preference is enabled. Loaded history never counts as a new user turn.

## Lifecycle transitions

| Transition | Required result |
| --- | --- |
| Start input | Acquire current ownership; never inherit stale soft mute or transcript state |
| Soft mute | Keep recognition available for the resume command, but discard dictation |
| Resume | Clear only the current session's soft mute |
| Stop input | Cancel starts, capture, recognition, partial hypotheses, and delivery timers |
| End conversation | Stop input and playback, clear queues/timers/transient errors, release ownership |
| Switch chat with voice mode active | Retire the old composer, cancel its operations, create clean transient state for the new composer |
| Settings change | Stop affected resources before applying the normalized preference to the next operation |
| Unmount/dispose/pagehide | Invalidate pending work and release every owned resource |
| Late async result | Ignore it unless its session and operation generation are still current |

## Invariants

1. A new session never inherits soft mute.
2. Old recognition never writes into a new composer.
3. Cancelled or replaced playback never resumes itself.
4. Only the current owner may control shared hardware or host playback.
5. Failed teardown blocks unsafe replacement rather than overlapping resources.
6. End conversation leaves no capture, playback, countdown, queued transcript, or silence timer active.
7. Raw audio and transcript content are not logged by default.

These rules require regression tests where automation is possible and physical-device checks where browser permissions or hardware behavior cannot be simulated faithfully.
