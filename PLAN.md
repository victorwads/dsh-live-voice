# DSH Live Voice — Features and Plan

This document describes the intended product and proposed architecture. These are plans, not implemented features or a fixed technical specification. The package currently contains documentation only.

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
