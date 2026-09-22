# Architecture Review Guide

## Authoritative boundaries

- Client root: `src/app/client/apply.tsx`.
- Server root: `src/app/server/apply.ts`.
- Client i18n: `src/app/client/i18n`.
- Conversation UI: `src/modules/conversation`.
- Settings runtime: `src/modules/settings/components/LiveVoiceSettings.tsx`.
- Recognition engines: `src/modules/recognition/engines`.
- Speech engines: `src/modules/speak/engines`.
- Shared UI primitives: `src/shared/design-system`.

No compatibility implementation remains under `src/client`, `src/core`, or `src/engines`; those trees must not be recreated. Barrels expose implementations physically owned by their modules rather than forwarding to legacy trees.

## Review rules

1. App composes modules; modules may import shared code; shared code never imports modules.
2. The centralized client i18n API is the sole intentional module-to-app dependency.
3. Every registered slot is wrapped by the DSH language boundary.
4. Provider adapters remain separate from conversation policy.
5. Browser bundles contain no Node built-ins.
6. Storage keys, routes, slot IDs, and established CSS classes remain stable.

## High-risk manual checks

- Start, stop, cancel, mute, and resume input.
- Start a conversation, switch chats, and verify transient mute does not leak into a new session.
- Test Speakers and Headphones turn-taking.
- Test pause, resume, next segment, and stop-all playback.
- Exercise queue and steer delivery, pending questions, devices, permissions, and provider settings.
- Change DSH UI language without changing STT/TTS selections.
- Test authenticated routes with real providers when available.

The automated suite covers cancellation, stale results, engines, routes, normalization, locale completeness, lifecycle, slots, modular UI, and design-system contracts. Physical devices and the authenticated GUI still require manual verification.
