# Recognition module

`engines/browser/BrowserRecognitionEngine.ts` adapts browser speech recognition and reports local-pack/browser capabilities. `engines/qwen/QwenRecognitionEngine.ts` and `engines/whisper/WhisperRecognitionEngine.ts` adapt local-first HTTP recognition; host bridges live beside the relevant adapters (Whisper here, shared Qwen configuration in `../core/qwen`). `components/RecognitionCapabilityStatus.tsx` and engine settings UI present capability and configuration states.

Distinguish microphone capture and permission from recognition engine availability. Do not infer feature support merely from operating system. Bound audio and host requests, keep host-only code out of the browser bundle, and abort/ignore stale results after cancellation. Recognition language and voice-command phrases are independent of the interface locale. Browser simulations are not a physical microphone or model acceptance test.
