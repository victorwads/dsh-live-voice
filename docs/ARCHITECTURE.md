# Architecture

DSH Live Voice uses application composition roots, domain modules, and a domain-independent design system. There are no legacy client, core, or engine source trees.

## Dependency direction

1. `src/app` composes DSH services, slots, routes, modules, styles, and client language boundaries.
2. `src/modules` owns product behavior, feature UI, policies, engines, provider hosts, services, and models.
3. `src/shared` owns reusable domain-independent React primitives.
4. App code may import modules and shared code. Modules may import shared code. Shared code never imports modules.
5. Feature modules use the intentionally centralized client i18n API, but never register DSH slots or host routes.
6. Browser and host dependency graphs remain separate. Host-only Node imports must never enter the client bundle.

## Ownership map

- [Application composition, slots, routes, i18n](../src/app/ARCHITECTURE.md)
- [Core voice policy, ownership, settings normalization](../src/modules/core/ARCHITECTURE.md)
- [Conversation and composer behavior](../src/modules/conversation/ARCHITECTURE.md)
- [Settings presentation and storage](../src/modules/settings/ARCHITECTURE.md)
- [Recognition engines and capability](../src/modules/recognition/ARCHITECTURE.md)
- [Speaking engines and playback](../src/modules/speak/ARCHITECTURE.md)
- [Shared design system](../src/shared/ARCHITECTURE.md)

Read the relevant local architecture file before editing a boundary. The source of truth for plugin and tested-DSH versions is `package.json`.

## Optional diagnostics

The main client publishes a versioned, read-only diagnostic source through `src/modules/core/diagnostics.ts`. The separately built `src_debugger` plugin owns all inspector UI and optional Developer-tab activation inside Live Voice Settings; the main client never imports it. See [debugger architecture](../src_debugger/ARCHITECTURE.md) for installation, sampling, privacy and current limitations.

## Stable contracts

- Preserve DSH slot names, IDs, order, and injected services.
- Preserve authenticated same-origin API routes.
- Preserve persisted key `dsh-live-voice.settings` and normalization.
- Preserve pause, resume, cancel, ownership, interruption, and stale-result semantics.
- Do not log raw audio or transcripts by default.
- Treat lifecycle behavior in [VOICE-LIFECYCLE.md](VOICE-LIFECYCLE.md) as the natural-language behavioral contract.
