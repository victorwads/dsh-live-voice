# Speaking module

`services/speechQueue.ts` schedules speech independently of capture and agent generation. `engines/browser/BrowserSpeakingEngine.ts` uses browser voices, `engines/qwen/QwenSpeakingEngine.ts` uses the Qwen HTTP bridge, and `engines/say/` uses the macOS host speaker. `engines/audio/` manages host audio playback and transcoding. `qwen/QwenSpeakingSettings.tsx` presents engine-specific settings.

Keep provider adapters separate from conversation policy and DSH composition. Maintain truthful pause/resume capability and distinguish pause from stop/cancel. Abort old operations and prevent stale synthesized audio from beginning after a newer turn or cancellation. Do not let a Settings speech test bypass page-level ownership. Local TTS is an option; it does not imply the DSH model runs offline.
