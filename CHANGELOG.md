# Changelog

All notable changes to DSH Live Voice are documented in this file.

## [0.2.0] - Unreleased

### Release Changes

This release expands conversation control, audio routing, speech filtering, and settings organization.

### Features

- Narrate newly pending DSH structured questions when voice conversation mode is active, reading each question prompt once through the selected speech engine.
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

[0.2.0]: https://github.com/victorwads/dsh-live-voice/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/victorwads/dsh-live-voice/compare/v0.0.2...v0.1.0
[0.0.2]: https://github.com/victorwads/dsh-live-voice/compare/v0.0.1-alpha.1...v0.0.2
[0.0.1-alpha.1]: https://github.com/victorwads/dsh-live-voice/tree/v0.0.1-alpha.1
