# Architecture

DSH Live Voice uses application composition roots, domain modules, and a domain-independent design system. There are no legacy client, core, or engine source trees.

## Dependency direction

1. `src/app` composes DSH services, slots, routes, modules, styles, and client language boundaries.
2. `src/modules` owns product behavior, feature UI, policies, engines, provider hosts, services, and models.
3. `src/shared` owns reusable domain-independent React primitives.
4. App code may import modules and shared code. Modules may import shared code. Shared code never imports modules.
5. Feature modules use the intentionally centralized client i18n API, but never register DSH slots or host routes.
6. Browser and host dependency graphs remain separate. Host-only Node imports must never enter the client bundle.

## Composition roots

- Client: `src/app/client/apply.tsx`.
- Server: `src/app/server/apply.ts`.
- Slot definitions and registration: `src/app/client/slotDefinitions.ts` and `registerSlots.tsx`.
- Styles: `src/styles/index.ts`.

## Internationalization

The only client language tree is `src/app/client/i18n`. It owns typed catalogs, the React runtime, DSH catalog registration, and synchronization with `ctx.locale`. Every DSH slot component is wrapped by the application language boundary. UI locale, recognition language, synthesis language, and user-defined command phrases are independent values.

## Modules

- `modules/core`: shared voice-domain coordination, settings normalization, ownership, transcript handling, microphone policy, filters, and shared Qwen configuration.
- `modules/conversation`: composer/chat UI, conversation components, chat models, and session-facing behavior.
- `modules/settings`: modular Settings shell, hooks, services, and Conversation/Recognition/Speech sections.
- `modules/recognition/engines/{browser,qwen,whisper}`: recognition adapters and provider-specific host/UI code.
- `modules/speak/engines/{browser,qwen,say,audio}`: speech adapters, host audio, transcoding, and provider clients.

## Stable contracts

- Preserve DSH slot names, IDs, order, and injected services.
- Preserve authenticated same-origin API routes.
- Preserve persisted key `dsh-live-voice.settings` and normalization.
- Preserve pause, resume, cancel, ownership, interruption, and stale-result semantics.
- Do not log raw audio or transcripts by default.
- Treat lifecycle behavior in [VOICE-LIFECYCLE.md](VOICE-LIFECYCLE.md) as the natural-language behavioral contract.
