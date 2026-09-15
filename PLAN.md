# DSH Live Voice — Features and Plan

This document describes the product plan and local implementation progress. The published npm version is a documentation placeholder; the working tree now contains an initial plugin undergoing integration validation. Features below describe intended behavior unless verified in the progress section.

## TypeScript migration

The implementation, tests, and developer scripts now use `.ts` source files. `tsconfig.json` centralizes compiler settings and `npm run typecheck` is part of the build path. The build generates a bundled browser client (`lib/client.js`), an ESM host bundle (`lib/server.js`), and temporary transpiled test artifacts that are ignored by Git. This is a source-language migration; the DSH runtime still receives JavaScript bundles. The compiler setup is transitional: current converted legacy files use `@ts-nocheck`, so this is not yet a claim that every implementation boundary has complete static typing.

## Corrected composer recognition integration

The mounted browser-recognition regression now verifies the real DSH slot contract: `useInput` provides the subscribed shell input state and `inputActions.setDraft()` updates the Lexical composer. The previous direct-input preference was incorrect. The adapter now prefers `useInput`, preserves optimistic draft writes until the matching input-state publication arrives, and avoids applying an empty interim update after a final recognition result. This eliminates the demonstrated race where recording status could appear while a final recognized phrase never reached the composer. Mocked DOM/native-recognition coverage cannot prove physical microphone recognition in the authenticated GUI.

## Optional interruption when sending a user message

A new user or steering message no longer stops active or paused assistant speech by default. Conversation settings expose **Stop assistant speech when I send a message**, default off, for users who want that turn-taking policy. This remains separate from acoustic interruption in open-microphone mode and from the manual Stop speech control. History pagination and older user nodes never trigger interruption.

## Stable silence before automatic assistant speech

Automatic assistant announcements now wait for a configurable continuous-silence window after user speech ends (1–10 seconds, default 3). Returning speech cancels the timer and starts a fresh full delay when activity ends again, so a breathing pause cannot hand microphone ownership to output. Only queued automatic announcements pass through this gate; explicit per-message playback remains immediate. Ending the conversation or disposing its session cancels the timer.

## Manual and automatic sending

The Conversation card separates listening policy from sending policy. Its listening-mode explanation changes with Speakers/gated or Headphones/open microphone. Sending defaults to Manual, leaving recognized text for review and the normal DSH Send control. Automatic mode starts a configurable 2–10 second countdown (default 4 seconds) after a final recognized phrase, shows the remaining seconds in the voice bar, and invokes the public `InputActions.submit()` action only if the draft remains unchanged. New speech, composer edits, stopping input, disposal, changing back to Manual, or the Cancel automatic send control invalidates the pending submission. This flow uses DSH admission/submission rather than simulating Enter or clicking the DOM.

## Collapsible settings and explicit conversation policy

Settings now use three collapsible root cards: Speech output, Speech recognition, and Conversation. All three start collapsed, so the panel initially shows only the available configuration domains. Engine-specific controls are shown directly in one **Connection settings** subcard, with no redundant nested provider box; plugin-managed Silence detection is a sibling collapsible subcard, keeping the common engine/language choices visible without presenting every advanced field at once. Conversation exposes an explicit, default-enabled preference to speak new assistant messages automatically during an active voice conversation. Disabling it consumes new text without queueing or replaying it later. The existing coordinator still waits while recognition reports user speech before draining assistant playback.

## Voice status above the message composer

The active recording/status bar uses the session-scoped `conversation.input.dock` slot with leading order, which the installed DSH renders before `conversation.composer.bar`. The previous `conversation.composer.dock` placement belongs to the default input component and renders after the message editor, causing voice controls to appear at the bottom. The microphone launch controls remain in `conversation.input.right`.

## Recognition language and nested silence detection

The pause segmentation controls are nested inside the Speech recognition card and named **Silence detection**, clarifying that the profiles choose how long a pause closes an utterance. Recognition language is separate from speech-output language. Whisper HTTP offers **Automatic — detect language**, which is transported as `x-dlv-language: auto` and submitted to whisper.cpp as multipart `language=auto`; Browser SpeechRecognition continues to offer concrete browser language tags only. Switching from Whisper with Automatic selected back to Browser resets recognition language to Portuguese (Brazil), because the browser API requires a concrete language.

## Simple provider-independent voice detection

Recognition provider configuration and browser-side audio segmentation are now separate concerns in Settings. Provider connection controls remain inside Speech recognition and change with the selected engine. Engines whose raw audio is captured by this plugin opt into a separate Voice detection block; currently that is Whisper HTTP, while Browser SpeechRecognition continues to manage its own boundaries. The normal interface offers only Short (900 ms), Natural (1500 ms, default), and Long (2200 ms) pause profiles. The selected browser preference is passed into the capture adapter, so it can be reused by future external recognition providers without making VAD look like a whisper.cpp server setting.

## Host-side Whisper HTTP recognition

Whisper HTTP is now a selectable recognition engine. Research against current upstream whisper.cpp confirmed that its built-in `/inference` API is complete-file multipart HTTP, not true realtime input streaming: there is no WebSocket, SSE transcript stream, or incremental request processing. The implementation therefore reuses the active browser microphone stream, segments bounded utterances after trailing silence, resamples them to canonical mono 16 kHz PCM16 WAV, and sends raw binary through an authenticated DSH Fetch route. The host validates the WAV, permits only a configured loopback HTTP endpoint (`DSH_LIVE_VOICE_WHISPER_URL`, default `http://127.0.0.1:8080/inference`), forwards multipart to whisper.cpp, and returns final text. Browser cancellation/stale-session guards prevent late transcripts from reaching the composer. A separate realtime adapter can be added later for a protocol that actually supports streaming, such as an OpenAI Realtime-compatible server.

## Real composer transcription binding

Correction to the earlier diagnosis: installed DSH publishes `input` as a subscribed runtime hook (`useInput`) and `inputActions` as the action face. The earlier claim that `useInput` was fabricated was incorrect; the sibling plugin used a different contract. The previous direct-callback test did not establish native recognition-to-reactive-editor integration. The current repair prioritizes the subscribed hook, keeps legacy direct input compatibility, and tests native recognition events through a mounted reactive composer. Physical-browser confirmation must remain distinct from mocked speech events.

## User-controlled Browser recognition privacy

Post-goal policy correction: Browser SpeechRecognition now exposes two user-controlled settings. `Process recognition locally on this device` chooses strict on-device recognition or the browser recognition service, which may process microphone audio remotely. When local processing is selected, `Automatically install this browser language pack when needed` allows the browser-native `SpeechRecognition.install()` flow after `available()` reports `downloadable`. No fallback is silent: disabling local processing displays a privacy warning. The installed pack flow uses the browser API and verifies availability afterward. Full suite: 89 passing tests.

## Grouped engine settings

Post-goal Settings UX correction: settings now distinguish Speech output and Speech recognition in separate native fieldsets. Recognition has an explicit engine selector, currently offering the only implemented adapter, Browser SpeechRecognition with a local language pack. The persisted schema records `recognitionEngine: "browser"` now, so future engines can be added without changing the settings layout or migrating legacy browser users. The selector copy clearly says additional engines appear only when installed; it does not imply Whisper or remote recognition support. Full suite remains 88 passing tests after the grouped Settings update.

## Nonblocking settings changes

Post-goal UX correction: Settings changes are no longer rejected while listening, speaking, starting, or in conversation mode. The new preference is normalized and persisted immediately, current voice resources are stopped, and the latest revision is applied to every surviving session for its next operation. Revision guards prevent an older slow teardown from overwriting a newer rapid settings change. Mounted coverage verifies active voice shutdown, immediate persistence, application, and absence of the old alert. Full suite: 88 passing tests; native say route/process/cleanup smoke passes.

## Capture capability refresh

Round 12: devicechange and visible-page transitions now refresh browser/host capabilities for mounted conversation and Settings controllers, with listener teardown on disposal. Settings presents microphone unsupported/denied states separately and explains that a prompt occurs only after an explicit voice action. A denied real getUserMedia attempt immediately updates capture capability. Full validation: 87 passing tests, real say route/process/cleanup smoke passes, diff check passes, and the installed profile dependency resolves to this working tree.

## Focused audit corrections

Round 11: two independent code audits found and prompted fixes for concrete integration defects. The per-message action now speaks only its durable assistant message rather than concatenating the entire turn, and playback controls stay disabled while output capability is unknown or unavailable. Microphone capture/Web Audio/security/permission capability is tracked separately from the local recognition pack. Browser pause/resume support is reported and honored truthfully, including late-pause completion protection. Recoverable no-speech now reaches the bounded recognition restart path. Settings refreshes when local browser voices change, clears cross-engine voice names, and offers only enumerated local browser voices.

## Coordinated Settings playback

Round 10: Settings speech self-test now participates in the same page-level VoiceOwnership handoff as per-message speech and microphone sessions, preventing it from talking over an active conversation. Mounted lifecycle coverage passes. Full suite passes after the Settings self-test and dismissible diagnostics changes; linked client bundle rebuilt. Focused SDK and core audits remain active.

## Settings output self-test and dismissible diagnostics

Round 9: Settings now includes Test selected speech output and Stop speech test so browser and macOS output can be checked independently from recognition and message-row matching. Errors are explicitly dismissible. Mounted tests cover the self-test and microphone diagnostic dismissal; full suite remains 83 passing tests. Two focused audits of SDK client integration and voice core behavior are running.

## Independent capability publication

Round 8: speech engines now publish availability as each probe finishes; they no longer wait for browser language discovery. Regression demonstrates output availability while recognition is pending. Full suite: 83 passing tests. Removed misleading advice to select another recognition engine: none is implemented in this delivery. Remaining concrete acceptance conditions are authenticated GUI validation and local browser STT availability, not native say completion. Continue auditing SDK integration and user-reported failures without retrying the rejected diagnostic-server escalation.

## Native route smoke validation

Round 7: `node scripts/smoke-say.mjs` passed with real native speech through SayClient, request/response envelopes and actual registered host Fetch handlers. No diagnostic server was started and no credentials accessed. Added automated cross-boundary route regression without sound. Authenticated GUI remains unverified; the previously rejected diagnostic-server escalation is not retried.

## Playback row compatibility correction

The maintainer reported disabled message playback. Installed Chat renders `assistant-step` nodes (verified in its buildViewNode), not the `assistant` kind used by earlier fixtures. The adapter now accepts `assistant-step` and the legacy kind. Mounted regression verifies Play is enabled and dispatches speech even when recognition is unsupported. Recognition diagnostics distinguish downloadable/downloading/unavailable language status. This fixes a concrete playback adapter bug; local microphone recognition still requires supported browser capabilities and installed packs.

## Startup integration correction

The maintainer reported duplicate insertion and a `webServer` context failure. Use CLI bundle activation only. Adding `webServer` injection did NOT fix the failure: it was reproduced with the authorized separate instance on port 2020. Replaced the custom RPC channel with public `connection.fetch.register` exact routes under `/api/dsh-live-voice`, retaining the authenticated carrier and disconnect signal. Real boot now succeeds using `dsh web --trusted-host dsh.wads.dev --no-open --port 2020`; HTTP GET on that port returns the expected unauthenticated 401. The diagnostic instance was stopped after validation; the existing instance was not restarted. All 79 tests pass, including envelope validation and registration disposal. This proves server startup, not authenticated UI/microphone acceptance.

## Resumed acceptance work

Goal resumed explicitly by the maintainer. The reported disabled say option exposed a browser SDK contract error: channels allow one segment only. Corrected the call to channel `/api`, endpoint `dsh-live-voice/<operation>`, and matching server envelope validation. Previously passing mocks allowed invalid nested channels. Tests now enforce the SDK channel pattern; 80 tests pass. Settings show failures for both output engines instead of hiding the unselected engine’s reason. Next: exercise real authenticated diagnostic-instance transport and settings using its own legitimate launch flow, then audit remaining voice behavior. Do not equate startup or mock tests with end-to-end completion.

## Settings placement correction

Removed the composer gear and floating settings overlay. Preferences now occupy the public `settings.section` slot as Live Voice, including when no conversation is mounted. Unavailable microphone buttons now explain the local-recognition limitation on click rather than remaining inert. They do not start remote recognition or download language packs. Settings remain browser-local.

## Accepted first-delivery scope

The maintainer authorized implementation, not just planning. Target acceptance is the user’s macOS with a cross-platform browser UI and honest capability fallbacks.

- Ship macOS `say` (temporary text file, await child completion, cleanup on all paths) and browser `speechSynthesis` as separate speaking engines.
- Use browser SpeechRecognition for input. Check local processing support; never silently fall back to remote recognition or download language models. Browser-local recognition availability is a compatibility risk to investigate.
- Preserve referenced per-message play/stop icon placement and composer microphone/recording waveform behavior, while designing independent internals.
- Include continuous conversation mode, visible idle/listening/recognizing/speaking status, global speech stop, and end-conversation cleanup.
- Preserve editable composer text; interim recognition owns only its own insertion and final results commit without replacing user edits.
- Separate extensible engines under `src/engines/speaking/` and `src/engines/recognition/`.
- Inspect sibling `dsh-speak` and `dsh-voice` clones for APIs and UX, not architecture to copy. User handles uninstalling prior plugins; do not coordinate with them.
- Dependencies permitted, Python only if necessary. No Homebrew, model downloads, paid/external providers, or local speech services other than `say`.
- Local development only: no commits, push, or publication. Link this folder into DSH if supported without restart/reset; do not restart DSH or require user validation to finish implementation.
- Automated checks do not substitute for user microphone/speaker validation; report that boundary honestly.

### Implementation progress

- Implemented speaking/recognition engines, authenticated RPC, coordinator, editable transcript, real microphone metering, UI slots, and client bundling. Tests pass for fake engines/core/RPC/bundle.
- Real macOS say invocation completed successfully with idle state and no cleanup error. No microphone recording performed.
- Installed link in web profile. Activation uses profile insert; removed this plugin from bundle list to prevent duplicate entries. No restart/reset or publication.
- HTTP 127.0.0.1:3080 returns 401 unauthenticated. Actual mounted UI and on-device recognition still need authenticated browser validation; do not bypass authentication.
- Full suite: 78 passing tests, including 9 real React StrictMode/jsdom lifecycle tests, mounted component controls, engine/RPC/core regressions, and bundle contracts. Isolated Chrome layout preview inspected. Packaging dry run includes engines, client bundle, and development instructions.
- Persisted preferences now normalize malformed/null values, invalid engines, rates and voice names. New user/steering messages stop obsolete playback; history pagination does not. Actual SDK user-node sequence fields verified from installed source.
- Remaining acceptance: authenticated DSH activation and real browser microphone/local-pack availability are not established. No legitimate authenticated automation context is available; unauthenticated HTTP returns 401. Isolated Chrome reports packs downloadable, and downloading models is prohibited. This condition has persisted across rounds 2–4; do not bypass authentication or silently use remote STT.
- Round 5: stale capability refreshes are now generation-guarded with a regression test. Real macOS say smoke repeated successfully (idle, no error after completion/cleanup); full build/test suite and diff whitespace validation pass.
- Full-machine acceptance remains blocked by the same authenticated-browser/local-recognition availability condition across rounds 2–5. Implementation is locally delivered, but the goal is not complete. No microphone result or authenticated GUI activation is fabricated.
- Isolated installed Chrome 152 reports local recognition packs for pt-BR/en-US as downloadable, not installed. No download occurred; the maintainer’s normal browser profile may differ. Actual authenticated DSH activation and physical-device acceptance remain unverified.
- Local browser recognition may be unavailable without on-device support and installed language pack; no download or remote fallback is allowed.

## Product priorities

- **Local-first voice:** run both speech recognition (STT) and speech synthesis (TTS) on the user’s machine, with external providers as optional alternatives.
- **One coordinated experience:** listening and speaking share conversation policies instead of operating as unrelated plugins.
- **Simple setup:** minimize mandatory configuration, offer sensible defaults, and make switching recognition and speech engines easy.
- **Clear capabilities:** explain what is available on the user’s machine and what requires permissions, models, or additional setup.
- **User control:** expose understandable listening, speaking, paused, and error states, with accessible controls for interruption and resumption.

Local speech processing does not imply that the DSH language model runs locally. Engines, supported platforms, hardware requirements, and installation steps have not been selected or verified yet.

## Planned features

### Environment and capability detection

Detect the operating system, but base available options on actual capabilities: microphone permissions, input/output devices, local engine availability, playback controls, and shortcut scope. Explain missing capabilities and recovery steps in the interface.

The DSH host and browser may run on different machines. Distinguish the host environment from the device with the microphone and speakers. A browser-focused shortcut must not be presented as a global hotkey.

### Speaker mode

While the assistant speaks, prevent microphone audio from entering recognition so its own speaker output is not treated as user speech. A shortcut should let the user take the turn, pausing or stopping playback and enabling recognition.

Whether capture remains active while recognition is gated is undecided. The interface must distinguish capture from recognition and external transmission. This mode is intended to reduce feedback, not promise perfect acoustic echo cancellation.

### Headphone mode

Allow the microphone to remain available during assistant playback. When the user starts speaking, pause the assistant.

Voice activity detection can react quickly but may mistake noise for speech. Waiting for recognized words provides stronger evidence with more latency. The final policy may combine both; thresholds and behavior still need testing.

Users should explicitly select the acoustic mode. Detecting an output device does not prove that the microphone is isolated from assistant audio.

### Pause, resume, and cancel

- **Pause:** suspend playback while preserving its position and remaining content where supported.
- **Resume:** continue the preserved speech when it remains relevant.
- **Cancel:** discard obsolete speech, including queued and late-arriving audio.

An interruption may mean “wait a moment” or introduce a new request. Silence alone should not force an old answer to resume. How the user signals these intentions is still open; explicit controls offer a predictable starting point before automatic intent detection.

Some TTS engines cannot resume precisely. Plugin-owned playback and audio buffering may be necessary to preserve position; engine support must be verified before promising exact resumption.

### Conversation during response streaming

Allow the user to speak while DSH is still generating text. Treat these as distinct activities:

1. Agent text generation.
2. Text-to-speech synthesis.
3. Audio playback.
4. Microphone capture and speech recognition.

Pausing playback need not stop text generation. If the user introduces a new request, the integration must decide what happens to the old response using the controls DSH actually exposes.

For spoken streaming, collect suitable text segments, synthesize them, and play them in order. Cancellation must invalidate pending work so delayed results from an old response cannot start playing later. Sentence boundaries, latency, buffering limits, and error recovery need evaluation.

### Engine selection and interface

Provide one place to select microphone, output device, conversation mode, STT engine, TTS engine, and shortcuts. Keep provider-specific complexity behind clear options without hiding important costs, permissions, or data transmission.

Prioritize local engines while allowing optional external adapters. Do not assume that one plugin requires one provider. Reusing existing DSH plugins versus integrating engines directly remains undecided until their control surfaces are inspected.

## Proposed architecture

These are responsibility boundaries, not an established directory layout.

| Area | Responsibility |
| --- | --- |
| Environment and capabilities | Detect available features and explain limitations. |
| Conversation coordinator | Own turn-taking, interruption policies, pause, resume, and cancellation. |
| Voice input | Capture audio, detect speech, and integrate recognition engines. |
| Voice output | Integrate synthesis engines and own audio queues, buffering, and playback. |
| DSH integration | Connect messages, response streaming, generation controls, and session lifecycle. |
| Interface and controls | Present modes, devices, permissions, engine choices, and shortcuts. |

Keep the coordinator independent of individual engines and interface components. Input, output, and generation need separate states because listening and speaking can overlap. A single global “listening or speaking” flag is insufficient.

Before implementation, inspect actual DSH extension APIs. Do not assume hooks exist for interrupting generation, delivering a new user turn during streaming, controlling existing voice plugins, or registering global shortcuts.

## Suggested implementation sequence

This is a proposal for discussion, not an agreed release schedule.

1. **Validate integration points:** inspect DSH APIs and candidate local engines, including licenses, platforms, and pause/cancel capabilities.
2. **Build a controlled baseline:** coordinate one input engine and one output engine with explicit controls and speaker mode.
3. **Add streaming and robust cancellation:** queue audio, preserve playback when possible, and reject stale asynchronous results.
4. **Explore open-microphone interruption:** test headphone mode, voice detection, recognition confirmation, and resumption policies.
5. **Improve onboarding and portability:** explain environment capabilities, reduce setup steps, and validate additional engine/platform combinations.

## Validation scenarios

- Assistant audio from speakers does not enter recognition while recognition is gated.
- A manual interruption yields playback control and lets the user speak.
- A temporary pause can resume supported playback without restarting the whole answer.
- A new request does not accidentally resume an obsolete answer.
- Canceled synthesis results never play later, including during rapid interruptions.
- Headphone mode balances interruption latency against false positives.
- Missing permissions, unavailable engines, and device failures are visible and recoverable.
- Switching engines or ending a session cleans up capture and playback resources.
- Remote speech transmission is explicit; raw audio and transcripts are not logged by default.

## Open decisions

- Which local engines and platforms should the first working version support?
- Should the plugin reuse existing voice integrations or connect directly to engines?
- Which DSH controls are available during response streaming?
- How should users distinguish a temporary pause from a new conversational turn?
- Which playback layer can support reliable pause and resume?
- What speech detection policy works best with headphones?
- Which shortcuts can work globally, and what is the browser-only fallback?

The personal motivation belongs in [HISTORY.md](HISTORY.md). This document is the place for technical planning and may be revised as decisions are made.
