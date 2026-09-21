# Agent Instructions

## Project identity and current stage

- Project: **DSH Live Voice**; npm package: `dsh-live-voice`.
- Read the current project version from `package.json`; do not duplicate it in this instruction file. The local working tree contains a plugin under active validation. See PLAN.md for progress and remaining checks.
- Read `README.md`, `HISTORY.md`, and `package.json` before making project changes.
- Write repository documentation, code comments, and public package metadata in English. Keep the requested filename `HISTORY.md`.

## Product priorities

- Lead with **local-first voice conversations**. Both STT and TTS should be able to run on the user’s machine. External providers are optional.
- Do not claim full offline operation merely because voice processing is local; the DSH language model can be remote.
- Coordinate input and output in one plugin. Preserve separate states for capture/recognition, synthesis/playback, and agent generation.
- Keep pause, resume, and cancel distinct. Do not automatically resume obsolete speech just because the user becomes silent.
- Plan for speaker mode with recognition gating and manual interruption, and headphone mode with open-microphone interruption. Exact policies remain undecided.
- Capability detection must distinguish the DSH host from the browser/device environment. Do not assume OS detection proves feature support or that a browser shortcut is global.
- Make capture, recognition, transmission, playback, and permission states understandable to users. Avoid recording or logging raw audio/transcripts by default.

## HISTORY.md is a human story, not a work log

`HISTORY.md` tells the maintainer’s personal story: lived experiences using DSH, frustrations, needs, and hopes that led to this project. It is not a changelog, architecture document, decision register, or report of agent activity.

- Write in English, as a natural personal narrative grounded only in what the maintainer has actually shared. Do not invent feelings, experiences, motives, or outcomes.
- Append a new dated chapter only when the maintainer requests an addition to the human story. Routine technical work must not trigger a history entry.
- Never add CI/OIDC configuration, package metadata, licensing discussions, commits, pushes, releases, validation results, or file-edit summaries to this story. Put technical explanations in the appropriate documentation.
- Keep direct acknowledgments and links to the original authors in the main README, not as a separate acknowledgment entry in the history.
- Preserve existing chapters exactly. Future updates are append-only unless the maintainer explicitly requests a correction or rewrite. Correcting this initial misinterpretation does not authorize routine rewriting later.
- Read the story before appending. Use the actual date for new chapters, and do not add multiple entries merely because several tasks happened on the same day.

## Implementation discipline

- Inspect actual DSH extension APIs before selecting integration points. Do not fabricate hooks, plugin manifests, install commands, or support guarantees.
- Existing STT/TTS plugin reuse versus direct engine integration is unresolved.
- Keep conversation policy separate from provider adapters and UI.
- Do not implement features or add dependencies just to make the placeholder look complete.
- Keep planned capabilities clearly labeled until implemented and validated.
- Future audio work must account for echo, false interruptions, recognition latency, playback position, and stale asynchronous results after cancellation.
- Third-party engines and model weights require their own license and platform checks. This repository uses GPL-3.0-only. Commercial use and paid redistribution are allowed subject to GPL obligations; do not describe the license as non-commercial. Check DSH and dependency license compatibility before integration.

## Packaging and authorization

- Treat `package.json` as the single source of truth for version badges: `version` is the plugin version and `dshTestedVersion` is the tested DSH version. The build injects both values into the client bundle; do not hard-code them in source files.
- When changing either version, update `package.json`, keep the DSH-tested badge/link in `README.md` aligned, run the build to regenerate `lib/client.js`, and review the generated diff. `npm version` may update the package version and lockfile, but the README badge remains a manual documentation update.
- Keep public metadata and README aligned with the local-first focus.
- Do not invent author or repository URLs.
- Use explicit `--tag developing` for this prerelease. Never silently promote it to `latest`.
- `npm publish --dry-run --tag developing` validates packaging without publishing; it does not reserve a name or prove registry authorization.
- Run npm test (includes a client build). Fake-engine and DOM integration tests do not prove real microphone/browser compatibility; report physical-device and authenticated-runtime checks separately. Never describe a packaging dry run as a runtime test.
- Commit, push, actual npm publication, and secondary package creation require explicit maintainer authorization.
- The maintainer supplied `git@github.com:victorwads/dsh-live-voice.git` and authorized the first commit and push to `main`. npm publication requires separate authorization.
