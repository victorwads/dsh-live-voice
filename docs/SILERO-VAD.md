# Experimental Silero VAD

Energy detection remains the default. Only `voiceDetectionEngine: "silero"` opts into the browser model; unknown or missing persisted values normalize to energy. Browser STT is unchanged. Audio metering remains RMS regardless of the selected detector.

## Ownership and processing

The browser pool shares one worker and one ONNX Runtime WASM inference session, created lazily on first Silero capture and released when the last source leaves. Each source has its own streaming resampler, 512-sample/16 kHz frames, recurrent state `[2,1,128]`, 64-sample context, generation, bounded FIFO and segmentation state. Round-robin inference preserves per-source order; simultaneous capture does not require simultaneous model runs. A stopped source cannot release another source’s runtime. Overload or runtime errors are surfaced; no silent fallback after packaged availability succeeds. Installations without assets use energy as described below.

Capture uses AudioWorklet, with no audible monitoring. The HTTP engines consume 16 kHz PCM frames with probability hysteresis, bounded 320 ms pre-roll, minimum speech duration and the existing silence/maximum segment preferences. Energy capture retains its existing ScriptProcessor/RMS behavior. Input changes restart microphone recognition; existing shared capture keeps start-time options until explicitly restarted.

## Distribution

VAD binaries are ignored by Git and included only in the built npm package (or a local source build). The lightweight authenticated `availability` endpoint checks required files without loading the model. Settings keeps the detector selector visible and disables only the Silero option when assets are absent, without a disclaimer; a previously saved Silero preference uses energy on that installation. Persisted preferences are not rewritten. Runtime/model failures after availability succeeds still surface normally. The detection section is hidden only for Browser STT; other and future recognition engines can use it.

Build resolves pinned npm dependencies, copies the Silero v5 ONNX model and matching ONNX WASM/MJS bindings, builds a worker/worklet and writes licenses plus SHA-256 manifest under the published `lib/vad/` directory. DSH Connection registers exact allowlisted same-origin asset GET routes behind its normal HTTP authentication. No CDN or build-time model fetch is required. WASM uses one thread without requiring cross-origin isolation or GPU.

## Debugger telemetry

The optional debugger uses the same expandable state tree for all modules. Shared VAD information lives at `audioSources.vad`: lifecycle status and model/WASM file sizes in bytes and MiB. These are packaged asset sizes, not RAM usage or current transfer volume. Page heap, partial transfer counts and the dedicated VAD summary are intentionally omitted. Source projections retain configured/active detectors and correct 16 kHz duration calculations. No raw PCM or transcript is added to telemetry.

## Validation

Unit/DOM tests cover opt-in normalization, UI selection, independent source state, bounds, resampling and lifecycle failures. These are not proof of physical microphone accuracy, browser permissions, authenticated DSH deployment or mobile performance. Test actual simultaneous microphone/shared capture before release. Additional isolated participant streams can use the same runtime contract, but acquiring Meet tracks is a separate integration; VAD does not identify speakers or unmix audio.
