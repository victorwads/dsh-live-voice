# Changelog

All notable changes to DSH Live Voice are documented in this file.

## [0.3.3] - Unreleased

### Release Changes

This version adds the optional Live Voice Debugger and a two-package workspace, keeps spoken Send and Queue commands independent of automatic-send preferences, and preserves the composer caret and selection while final dictation is appended. Both plugin packages are versioned together at 0.3.3; this section remains unreleased until publication.

### Features

- Normalize Markdown for speech using the Marked parser: remove visual formatting, announce links and images without reading full URLs, shorten file paths with line references, read task lists and table headers/rows, and abbreviate long identifiers. Feed the same normalized text to playback and live captions, preserving the existing code-block line limit.
- ⭐ **Dedicated Speech Bar with Live Captions** — a new 52px bar above recognition controls.
  - Show approximate captions on one clipped line, using host audio timing or a pause-aware native-synthesis estimate; captions are not word-aligned.
  - Place previous/next controls on opposite sides of the text, with pause/resume, stop, and a current/total segment counter. Keep microphone takeover in the recognition bar.
  - Show a thin playback progress line and an indeterminate loading animation while audio is prepared or downloaded, respecting reduced-motion preferences.
  - Keep the bar visible between segments and retain message-grouped history and prepared audio until playback finishes or is stopped.
- Add Live Voice Debugger as a separate, optional package in the same repository. Installing it contributes a Developer tab inside Live Voice Settings; the main plugin works without the debugger and does not bundle its interface.
- Open the read-only inspector in a separate browser window, with independently scrolling state and event panes, queue inspection, module filtering, event pause/resume and clearing, and selectable 1–20 Hz refresh (10 Hz by default). Keep diagnostic history bounded and text content hidden unless explicitly enabled.
- Add fake-adapter and DOM regressions for state transitions, segmentation, optional activation, popup handling, event controls, and refresh frequency.

### Configuration Changes

- Disable Control hold-to-talk by default; keep it available as an opt-in and preserve saved preferences.
- Offer automatic-send delays of 600 ms, 800 ms, and 1–6 seconds with localized duration labels. Keep 4 seconds as the default and reset unsupported saved delays to that default.

### Build and Release Checks

- Reorganize the repository as a pnpm workspace with two complete plugin packages under `packages/live-voice` and `packages/live-voice-debugger`, each with separate source, tests, manifests and runtime bundles. Update builds, local-link paths, CI and publication paths for the monorepo.

- Keep the main and debugger package versions aligned. Reject mismatches during builds, CI and the publication workflow. The debugger is a public package. The manual OIDC publication workflow supports both packages or either package individually; no publication is triggered by a push.

### Bug Fixes

- Fix voice delivery being queued when DSH uses Steer for normal Enter. Use an unmodified Enter gesture for steering and Ctrl+Enter for the opposite mode instead of assuming the public submit action follows the busy-Enter preference.
- Fix manual turn playback reading only the closing assistant message. Read all visible assistant responses in the selected turn in step order, including intermediate messages, while excluding user messages, hidden reasoning, and other turns.
- Recover from `OverconstrainedError` when opening a selected microphone: clear and persist only the input-device selection, then retry once with the system default. Preserve unrelated preferences, permission errors, cancellation, and newer device selections.
- Fix Steer and Queue delivery for either DSH busy-Enter policy. Add a persisted, translated question asking what Enter currently does in the user’s DSH; the answer controls Live Voice’s normal-versus-Ctrl+Enter mapping without changing DSH settings. Keep Queue as the compatibility default and apply changes at delivery time to automatic sends, spoken commands, and hold-to-talk. Expose this non-sensitive enum in the debugger’s existing settings snapshot without enabling text-content inspection. Add normalization, mounted settings, composer gesture, and debugger regressions.
- Preserve the composer caret, forward/backward selection, focus, and scroll position when appending final dictation. Restore selection after DSH rebuilds editor nodes and notify its selection bridge; explicit Clear remains a separate action.
- Keep spoken Send and Queue commands as one-shot delivery actions. They no longer enable automatic sending, change its mode, or persist a different sending preference. Manual sending remains manual after a spoken command; existing automatic modes remain unchanged.
- Add regressions for spoken delivery in Manual, Queue, and Steer modes, including unchanged preferences, no settings writes, and subsequent dictation behavior.

## [0.3.2] - 2026-10-06

### Release Changes

Voice control feels more immediate: the new default Short profile sends captured speech for recognition after 500 ms of silence, reducing the wait before transcription and voice-command execution. Maintainer feedback reports a noticeably more responsive experience in daily use. This reduces the segmentation delay, not model inference time, and does not claim improved recognition accuracy. Natural, Long, and Custom remain available for longer pauses. All Live Voice preferences now live on the DSH server instead of in browser storage, so browsers connecting to the same host load the same saved configuration. Legacy browser preferences are intentionally not migrated; configure them once again after updating.

### Changes

- Adjust silence-detection profiles to Short (500 ms, now the default), Natural (1000 ms), and Long (2000 ms).
- Add a persisted Custom silence profile with whole-millisecond input from 100 to 10,000 ms for Qwen and Whisper capture, translated into every supported interface language.
- Move every Live Voice preference to authenticated server-side persistence, including engines, languages, device selections, conversation policy, silence timing, response/send delays, filters, voice commands, and editable spoken-context text.
- Save normalized settings atomically with owner-only file permissions and serialize partial updates to preserve unrelated preferences during concurrent saves.
- Remove browser-storage reads and writes from the plugin; keep release-check metadata in memory only.
- Add translated server load/save errors in all six interface languages, with no browser-storage fallback.
- Add regression coverage for persistence across host-store recreation and independent clients, concurrent updates, file permissions, invalid requests, corrupted storage, and ignored legacy browser preferences.

### Bug Fixes

- Make dictation append-only: append final recognized chunks at the end of the current composer and keep provisional hypotheses out of its text. Existing text and manual edits are preserved; explicit Clear and normal submission remain separate actions.
- Accept manual composer updates when React skips the exact echo of an earlier voice write, preventing later chunks from restoring stale draft snapshots. Muting, cancellation, commands, and rejected short phrases no longer perform unnecessary whole-draft writes.
- Add mounted regressions for skipped voice echoes, manual replacement, delayed publications, and append-only final chunks; document the append-only lifecycle contract.
- Preserve spaces, commas, line breaks, and unfinished entries while editing voice commands and other settings. Normalize and save text only when the field loses focus, not on every keystroke.
- Centralize text inputs, textareas, and numeric inputs on one shared draft-field component. Parent updates and delayed server responses no longer overwrite an active edit; invalid numeric drafts restore the saved value on blur.
- Apply the same blur-only saving behavior to Qwen and Whisper connection fields, and allow empty voice-command fields without restoring fallback phrases.
- Add regressions for raw typing, comma-separated commands, blur-only commits, late parent updates, empty text, numeric validation, and restored defaults.

### Upgrade Notes

- Legacy browser preferences are not imported. The first load without saved server preferences uses defaults; configure Live Voice once again. Qwen and Whisper connection settings already stored on the host remain unchanged.
- Restart the DSH server after updating to load the new settings route, then refresh the browser. Refreshing the page alone is not sufficient.
- Device selections are shared too, but the selected device must exist and be usable in the current browser. Microphone permissions and browser language-pack installations remain browser-managed capabilities.

**Full Changelog:** https://github.com/victorwads/dsh-live-voice/compare/v0.3.1...v0.3.2

## [0.3.1] - 2026-10-03

### Release Changes

This release simplifies the Settings interface, supports larger Qwen recognition uploads, and confirms compatibility with the current tested DSH release.

### Changes

- Group the primary speech, recognition, and conversation settings into collapsed General sections, with icons on tabs and subsection headings.
- Start silence-detection settings collapsed and keep recognition capability status visible outside the General section.
- Add the General section label to every supported interface language and update accessibility and mounted-component regression coverage.

### Documentation

- Split agent guidance and architecture documentation by application, domain module, and shared design-system boundaries.

### Bug Fixes

- Increase the default Qwen recognition audio-upload limit from 2 MB to 50 MB and add regression coverage for uploads larger than 2 MB.
- Derive the installed-version badge and newer-release test fixture from package metadata instead of hard-coded plugin versions.

### Compatibility

- Confirm tested compatibility with DeepSeek Harness **0.2.0-rc.2** and correct the tested-version release link.

**Full Changelog:** https://github.com/victorwads/dsh-live-voice/compare/v0.3.0...v0.3.1

## [0.3.0] - 2026-09-24

### Release Changes

This release adds multilingual DSH-native localization, voice-aware agent context, smoother host-audio playback, and a modular foundation for future development.

### Features

- Translate the plugin interface into English, Portuguese (Brazil), Spanish, French, Hindi, and Chinese through the DSH locale service. Interface language remains independent of recognition language, synthesis language, and user-defined voice commands.
- Add a configurable, session-scoped Live Voice context for agent responses. During an active voice conversation with automatic spoken responses enabled, the agent receives editable guidance that its user-facing response will be spoken aloud.
- Add an English Live Voice context editor and Restore default action to Speaking settings; interface labels and help remain localized.
- Standardize host speech as compact AAC/M4A played in the browser: macOS `say` and Qwen synthesize internally to WAV, the DSH host transcodes it before transport, and up to three upcoming segments are synthesized ahead to reduce gaps.
- Add a configurable pause between consecutive spoken segments, with a 400 ms default for more natural pacing.
- Add a Next speech control that skips only the current spoken segment, immediately starts the next queued segment, and keeps queued and incoming streaming speech intact.

### Bug Fixes

- Preserve spaces and in-progress edits in text settings until the field loses focus, then normalize and save the value.
- Make automatic Steer delivery use DSH's Ctrl/Cmd+Enter accelerated composer gesture instead of the public normal-submit action, so messages are sent to the running agent rather than silently added to its queue. Add a lifecycle regression for the gesture.
- Deduplicate voice-context synchronization so the PUT request fires only when the payload actually changes, instead of on every coordinator state update.
- Prevent automatic assistant speech in speaker mode from overtaking the user's turn. Playback now waits for all pending backend transcriptions to finish and for the automatic-send countdown and delivery attempt to complete, avoiding canceled recognition, discarded transcripts, and interrupted automatic delivery.
- Consume visible assistant history when restarting voice conversation so previous responses and text streamed while voice mode was off are not replayed.

### Changes

- Migrate React UI components to TSX and organize the implementation into application composition roots, domain modules, and a reusable design system.
- Add a Preview.js component workspace with synthetic voice-bar and Settings scenarios for isolated UI development.
- Change the project license and package metadata from GPL-3.0-only to Apache-2.0.

### Documentation

- Add dedicated configuration, engine-selection, architecture, review, and voice-lifecycle guides.
- Update the quick-start command to install the plugin into the DSH web profile.

**Full Changelog:** https://github.com/victorwads/dsh-live-voice/compare/v0.2.3...v0.3.0

## [0.2.3] - 2026-09-21

### Release Changes

This release makes plugin updates and tested-version information visible in Settings and clarifies the recognition-engine roadmap.

### Features

- Add an update notification in Live Voice settings when a newer GitHub release is available. The check runs at most once every 24 hours and the action opens the matching release.
- Show the installed Live Voice version and the tested DSH version in the settings header.
- Show Browser WebGPU Inference, sherpa-onnx Streaming, NVIDIA Parakeet, and Voxtral Realtime as disabled upcoming recognition engines.

### Changes

- Rename recognition-engine options to describe the API they use: Browser SpeechRecognition, Qwen3 ASR HTTP API, and Whisper HTTP API.
- Show the expected HTTP URL or transcription route for the selected recognition engine.

### Bug Fixes

- Avoid repeated GitHub requests when the release API is unavailable by caching failed checks for the same 24-hour interval.
- Handle release tags with a leading `v` and prerelease identifiers correctly when deciding whether an update is newer.
- Ignore unexpected release URLs and fall back to the repository releases page.

### Documentation

- Improve README clarity and remove duplicated content.

**Full Changelog:** https://github.com/victorwads/dsh-live-voice/compare/v0.2.2...v0.2.3

## [0.2.2] - 2026-09-19

### Features

- Add an optional global hold-Control push-to-talk gesture that works while a composer is mounted even when regular voice mode is off. Releasing Control flushes queued transcription, waits the configured automatic-send delay, queues the completed draft once, and closes capture; Escape cancels the gesture.

### Changes

- Increase the maximum continuous-speech transcription chunk from 20 to 60 seconds by default for Whisper HTTP and Qwen HTTP recognition. Add a Speech recognition setting that lets users configure the limit from 10 to 300 seconds; uninterrupted speech is split and sent for transcription only after the selected duration.

### Bug Fixes

- Serialize Whisper HTTP and Qwen HTTP transcription segments through a per-session FIFO queue, preserving capture order while the microphone continues recording.
- Defer the automatic-send countdown while transcription segments are queued or a request is active.
- Discard queued segments and abort the active request when recognition stops, and clear the coordinator’s pending-transcription count.
- Add regression tests for serialized requests, ordered results, cancellation of queued work, and automatic-send gating until the transcription queue drains.

### Compatibility

- Record that the latest DSH version tested with this plugin is **0.1.6-alpha.2**.

## [0.2.1] - 2026-09-19

### Documentation

- Reframe the README around the local-first, hands-free experience, including continuous conversations, spoken structured questions, voice commands, and behavior across chat navigation.
- Expand package and README discovery keywords for hands-free voice, conversational AI, spoken prompts, Qwen3 speech engines, and Apple Silicon.

### Changes

- Update existing development dependencies.

### Bug Fixes

- Persist microphone enabled or muted state as a global preference and propagate settings changes to every active voice controller. New controllers now inherit the saved microphone state, and capability information is refreshed after synchronized settings changes.
- Keep microphone, conversation, and Speak controls available when DSH omits the legacy `uiSession.pendingInteractions` store. Structured-question voice handling remains inactive when that optional store is unavailable.
- Add regression coverage for global microphone-state normalization and for mounting voice controls without the legacy pending-interaction store.

## [0.2.0] - Unreleased

### Release Changes

This release expands conversation control, audio routing, speech filtering, and settings organization.

### Features

- Add hands-free DSH structured questions in voice conversation mode: narrate each prompt, capture the next spoken response as a custom answer, submit it automatically, and keep the Live Voice status bar visible over the question panel.
- Add audio input and output device preferences.
- Add a three-state delivery mode for manual review, queued delivery, and immediate steering.
- Add configurable speech-input filtering, including minimum-word filtering for final recognition results.
- Add configurable speech-output filtering to omit code blocks from spoken responses.
- Add exact voice commands for ending a conversation, muting or resuming listening, stopping speech, clearing input, and sending or queuing recognized text. Commands support multiple comma-separated phrases and normalize punctuation, case, and accents only while matching.
- Add a remaining-speech segment count to the automatic speech control; it remains expanded while speech is queued.
- Use the same newline-only segmentation and queue for automatic streaming speech and manual Speak actions.
- Add tabbed Live Voice settings to organize speech, conversation, commands, and advanced options.

### Changes

- Improve the Live Voice controls and settings interface for delivery, device, filtering, command, microphone-input, and speech-queue states.
- Expand coordinator, settings, component, and filter test coverage.
- Update compiled client and server bundles for the new functionality.
- Include this changelog in the published package.

### Bug Fixes

- Keep voice conversation mode active across chat navigation. When the current composer is replaced, the newly mounted chat automatically resumes voice mode; only an explicit End voice conversation action disables it. Composer drafts remain isolated per conversation, while internal controller disposal and hardware handoffs no longer count as user-requested conversation termination.
- Add lifecycle regression coverage for switching chats while voice mode is active and for preserving an explicit end across subsequent chats.
- Require at least one recognized word before headphone-mode microphone activity may pause assistant speech; audio activity alone no longer pauses playback.
- Debounce headphone-mode interruptions to reduce false pauses from short recognition events.
- Automatically resume speech when an interruption candidate ends without becoming valid user speech.
- Preserve manual pause behavior separately from automatic interruption handling.

## [0.1.0] - 2026-09-15

### Bug Fixes

- Reliably reset browser speech recognition after it ends or encounters an error.
- Allow a custom HTTP or HTTPS base URL for the host-local Qwen3 speech service.

## [0.0.2] - 2026-09-15

### Features

- Add host-local Apple MLX support for Qwen3-ASR and Qwen3-TTS.
- Add Qwen TTS voice selection in Live Voice settings.
- Expand Live Voice controls and their integration coverage.
- Add continuous integration, a pre-push hook, formatting configuration, and distribution-artifact validation.

### Changes

- Update the conversation coordinator, microphone, recognition, synthesis, Whisper, and native macOS `say` integrations for the new engines and controls.
- Include compiled client and server bundles in the published distribution.

## [0.0.1-alpha.1] - 2026-09-15

### Features

- First functional release of the DSH Live Voice plugin.
- Coordinate microphone capture, speech recognition, assistant-message delivery, and speech playback.
- Add voice typing in the DSH composer and continuous voice conversations.
- Support browser SpeechRecognition and authenticated loopback whisper.cpp HTTP recognition.
- Support browser speech synthesis and native macOS `say` output.
- Add Live Voice controls, Whisper settings, build and browser-preview scripts, and an initial test suite.

[0.3.0]: https://github.com/victorwads/dsh-live-voice/compare/v0.2.3...HEAD
[0.2.3]: https://github.com/victorwads/dsh-live-voice/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/victorwads/dsh-live-voice/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/victorwads/dsh-live-voice/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/victorwads/dsh-live-voice/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/victorwads/dsh-live-voice/compare/v0.0.2...v0.1.0
[0.0.2]: https://github.com/victorwads/dsh-live-voice/compare/v0.0.1-alpha.1...v0.0.2
[0.0.1-alpha.1]: https://github.com/victorwads/dsh-live-voice/tree/v0.0.1-alpha.1
