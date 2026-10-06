# Application boundary

Read [ARCHITECTURE.md](ARCHITECTURE.md) before changing composition roots, routes, slots, or language registration. Read the repository [AGENTS.md](../../../../AGENTS.md) for product, validation, and authorization rules.

- Inspect the actual DSH extension API before changing an integration point. Preserve established slot names, IDs, ordering, injected services, authenticated same-origin routes, and browser/host separation.
- Keep UI copy in the typed catalogs under `client/i18n/`; update every supported language in alphabetical key order. Use DSH `ctx.locale`, not an independent preference. UI locale is independent of recognition/synthesis languages and configured voice-command phrases.
- Treat `package.json` as the source of truth for plugin and tested-DSH versions. Never hard-code these in the client.
