# Changelog

All notable changes to DSH Live Voice are documented in this file.

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

[0.1.0]: https://github.com/victorwads/dsh-live-voice/compare/v0.0.2...v0.1.0
[0.0.2]: https://github.com/victorwads/dsh-live-voice/compare/v0.0.1-alpha.1...v0.0.2
[0.0.1-alpha.1]: https://github.com/victorwads/dsh-live-voice/tree/v0.0.1-alpha.1
