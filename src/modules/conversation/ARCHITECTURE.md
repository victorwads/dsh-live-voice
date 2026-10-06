# Conversation module

Dictation is append-only at the current composer end. Final chunks preserve existing and manually edited text; provisional hypotheses never rewrite the editor. Client synchronization must accept a new manual publication even when the previous voice echo was skipped, while ignoring unchanged stale slot snapshots. Explicit Clear and normal submit actions are separate from dictation.

`models/chat.ts` interprets DSH chat turns and pending questions. `hooks/useConversationController.ts` subscribes to session state; `hooks/useConversationActions.ts` maps user actions onto the controller. `components/` renders composer controls, microphone state, playback controls, status, and waveform; `createConversationComponents.tsx` composes them for the application slot boundary.

Keep UI components session-facing rather than importing host engines or registering slots. Preserve the DSH composer contract: `useInput` provides subscribed input and `inputActions.setDraft()` updates the composer; a recognition result must not be lost to stale interim updates. History pagination must not count as a new user turn. Do not treat sending, recognition, playback, or agent generation as one state. See [voice lifecycle](../../../docs/VOICE-LIFECYCLE.md) before changing interruption or turn-taking.
