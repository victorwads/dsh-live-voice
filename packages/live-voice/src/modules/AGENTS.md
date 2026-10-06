# Module guidance

Read the nearest module's `ARCHITECTURE.md` before changing its behavior. `src/modules` owns product policy, feature UI, models, providers, and services. Modules may use `src/shared` and the centralized `src/app/client/i18n` API, but must not register DSH slots or host routes; composition belongs to `src/app`.

Preserve local-first STT and TTS options without claiming DSH itself is offline. Track capture/recognition, synthesis/playback, and agent generation separately. Preserve pause, resume, cancel, ownership, interruption, and stale asynchronous result semantics. Avoid logging raw audio or transcripts by default. Consult [VOICE-LIFECYCLE.md](../../../../docs/VOICE-LIFECYCLE.md) for the behavioral contract and [root guidance](../../../../AGENTS.md) for testing and authorization.
