# Application architecture

`src/app` is the composition boundary between DSH and the voice-domain modules. Client and server entry points remain separate; host-only Node dependencies must never enter the browser bundle.

- `client/apply.tsx` injects DSH client services, creates session controllers and voice ownership, wires engines and settings, and disposes resources. `client/slotDefinitions.ts` and `client/registerSlots.tsx` own the established slot IDs, order, and registration. Preserve those contracts when changing placement. Microphone mode stop invalidates pending input ownership and application continuity without ending current playback; explicit takeover and full End retain their separate handoff/lifecycle semantics.
- `server/apply.ts` composes host engines and providers. `server/registerRoutes.ts` registers authenticated same-origin routes; do not bypass their validation or expose host access directly to browser code.
- `client/i18n` owns the only UI translation tree: typed, alphabetized catalogs for every supported locale, runtime selection synchronized with `ctx.locale`, DSH registration, and the boundary wrapping slot components. UI language must not change STT/TTS language or user-defined command phrases.
- Styles are assembled from `src/styles/index.ts`; design-system primitives live under `src/shared/design-system` rather than here.

Read [the repository overview](../../../../docs/ARCHITECTURE.md) for dependency direction and stable contracts, and the relevant module architecture before editing feature behavior. Read [application agent guidance](AGENTS.md) for operational constraints.
