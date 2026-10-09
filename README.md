# DSH Live Voice - You and Your Team / 即時語音 - 您和您的團隊

**English** | [Português (Brasil)](README.pt.md) | [简体中文](README.zh-CN.md)

[![npm version](https://img.shields.io/npm/v/dsh-live-voice?logo=npm&label=npm&color=brightgreen)](https://www.npmjs.com/package/dsh-live-voice)
[![Tested DSH](https://img.shields.io/badge/Tested_DSH-v0.2.1--alpha.2-5c5cff?logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-alpha.2)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)

**Tested and working with DeepSeek Harness v0.2.1-alpha.2.** This is the current tested DSH version, recorded in the `dshTestedVersion` field in [the main package manifest](packages/live-voice/package.json).

**Talk to your AI assistant, listen to its answers, and bring meeting context into the conversation—without constantly switching back to the keyboard.**

DSH Live Voice is a local-first voice plugin for DeepSeek Harness (DSH), with speech-to-text (STT), text-to-speech (TTS), and real-time meeting transcription.
*Built in Brazil 🇧🇷 and tested daily with Brazilian Portuguese on macOS.*

---

## ⚡ Quick Start

Install with `npx dsh` into your DSH web profile:

```sh
npx dsh plugin add --profile web dsh-live-voice
```

Open **DSH Settings → Live Voice** after your next DSH startup.

Interface translated into: 🇺🇸 English · 🇧🇷 Portuguese (Brazil) · 🇪🇸 Spanish · 🇫🇷 French · 🇮🇳 Hindi · 🇨🇳 Chinese. This refers to the plugin UI, not speech-recognition or text-to-speech language support.

## What can you do with it?

- **Work by voice:** dictate a request, talk through code or documents, and hear the assistant’s response while staying focused on your work.
- **Bring your AI assistant into the meeting:** in Google Meet or Teams, share your DSH window with audio so the team can follow along and hear the assistant’s answers. Capture the meeting audio, review and send the relevant context, then ask it to help answer a question, compare proposals with the project code, or summarize decisions—right in the discussion. Sharing the assistant’s playback audio requires separate setup in your meeting app and depends on browser and system support; this is not a native Meet or Teams integration.
- **Stay in control:** edit before sending, choose manual or automatic microphone delivery, and pause, resume, or stop spoken answers. **Ignoring** discards microphone dictation without closing capture or disabling speech interruption. Automatic interruptions recover after stable silence; manual pauses wait for Resume.
- **Choose your speech setup:** use local recognition and speech engines where supported, or configure an HTTP endpoint. Local-first voice does not mean DSH or its AI provider is fully offline.

---

## ✨ Features at a Glance

- 🎙️ **Voice Typing:** Append final recognized speech to the end of the DSH composer without replacing manual edits.
- 👐 **Hands-Free Conversation:** Continuous dialogue that stays active across chat sessions.
- ❓ **Spoken Structured Questions:** Narrates DSH prompt questions and submits your spoken answer.
- ⌨️ **Optional Hold-to-Talk (Push-to-Talk):** Enable it in Settings, then hold `Control` anywhere on the page to speak; release to queue the message after the configured send delay. Disabled by default.
- 🎧 **Acoustic Mode Isolation:** Gated listening for speakers (no echo) and open-mic interruption for headphones.
- 🗣️ **Spoken Commands:** Control the chat using phrases like *"send"*, *"mute"*, *"clear"*, and *"stop speaking"*.
- ⭐ **Dedicated Speech Bar:** Smoothly scrolling approximate captions, a moving highlight, previous/next navigation, pause/resume, stop, and a current/total segment counter. Captions show the text sent to the speech engine, without claiming word-level alignment.
- 🧹 **Markdown-Aware Speech:** Remove formatting, announce links without reading full URLs, shorten file paths and line references, read checkbox states and table rows, and replace long code blocks with a localized notice. Preserve custom notices.
- ⚡ **Responsive Conversation Settings:** Automatic-send delays of 600 ms, 800 ms, or 1–6 seconds (4 seconds by default), plus an assistant response delay of zero to 4 seconds (no delay by default). Recognition and synthesis still contribute to overall latency.
- 🛠️ **Optional Live Voice Debugger:** Install `dsh-live-voice-debugger` separately to inspect runtime state and queues from the Developer tab in Live Voice Settings. The main plugin works without it.
- 🏠 **Local-First Speech Options:** Use local engines such as Qwen or Whisper where supported. Browser recognition and configured HTTP services have their own processing requirements; do not assume every setup keeps audio on your machine.
- 🌐 **Your DSH voice assistant, even on your phone:** access your DSH over your home network or while away from home, and keep speaking to it (STT) and listening to its answers (TTS) from your phone’s browser. With host-backed engines, speech processing stays on the DSH computer while your phone captures your voice and plays the answers—no local model installation on the phone is needed. *I use Cloudflare Tunnel with authentication to access my DSH away from home.* Use HTTPS and authenticated access; microphone capture requires browser support and permission, including on your home network.

## 🧑‍💻 Meeting Mode — Real-Time Meeting Transcription and Live AI Q&A

Keep an editable transcript of a meeting as it happens, then ask the DSH assistant questions about the discussion without having to retell it afterward. Use it for code reviews, project discussions, or working through a spreadsheet together.

### From discussion to an answer

1. Select **Qwen HTTP** or **Whisper HTTP** recognition in Live Voice Settings.
2. Click the shared-audio icon beside the composer microphone and enable audio in the browser sharing dialog. Capture your microphone too when you want to include your own contributions.
3. Review the transcript in the composer, add a question, and send the relevant context to DSH. For example: *“What decisions have we made so far?”*, *“Help us answer this point”*, or *“Compare this proposal with the project code.”* Answers depend on the transcript you send and the code, spreadsheet, or documents you make available to the agent.
4. Read or listen to the answer while the meeting continues. For other participants to hear it, your meeting app must separately be configured to share the assistant’s playback audio.

### You control what is captured and sent

- Shared audio and your microphone have separate controls and can be stopped independently. Normal voice commands and assistant speech remain available.
- With both sources capturing, source changes introduce `Me:` or `Them:`; consecutive chunks continue on new lines. These labels distinguish audio sources, **not individual meeting participants**.
- An optional **Timestamp** clock toggle adds local timestamps such as `[YYYY/MM/DD HH:MM:SS]` to new source blocks, using chunk onset rather than recognition completion. It is off by default and never rewrites earlier text.
- Microphone and shared-audio bars mirror each other: the leading icon toggles **Listening / Ignoring**, with independent exact-command, timestamp, and Manual / Queue / Steer controls. Both use the same delivery countdown and cancel action. Ignoring does not end capture; stop sharing with the shared-audio button in the composer. Enabled commands and automatic delivery follow each source’s controls; review commands before enabling them for participant audio.

Audio availability depends on the browser, operating system, and sharing surface. This is **not a built-in Google Meet or Teams integration**. Capturing meeting audio and sharing the assistant’s voice back into a call require separate setup. Use headphones to reduce feedback, and obtain appropriate participant consent before capturing a meeting. Transcription and AI responses have processing latency; “real-time” does not mean instantaneous or guaranteed accurate.

## Documentation

Detailed guides for deep-diving into engines and configurations:

- **[Configuration & Conversation Flow Guide](docs/CONFIGURATION.md)** — Settings overview, speaker vs. headphone modes, sequence diagrams, silence delays, and external engine setup.
- **[Choosing a Speech Recognition Engine](docs/CHOOSING-AN-ENGINE.md)** — Comparison between Browser STT, Qwen3 ASR, and Whisper, with RAM footprints and OS compatibility.
- **[The Story Behind the Project](HISTORY.md)** — Why this project was built and the human story behind coordinating voice.
- **[Release notes](CHANGELOG.md)** — What changed in each version (canonical history in English).

---

## Workspace layout (contributors)

This pnpm monorepo contains two independently installable plugins:

- `packages/live-voice`: the main voice plugin, with its own source, tests, manifest and runtime bundles.
- `packages/live-voice-debugger`: the optional debugger, with its own `src`, tests and manifest.

Run `pnpm install --frozen-lockfile`, then `pnpm build` or `pnpm test` from the root. Build individual plugins with `pnpm --filter dsh-live-voice build` or `pnpm --filter dsh-live-voice-debugger build`. Root documentation covers both packages. The root English `CHANGELOG.md` is the canonical release history. Package READMEs link to that history. Existing DSH local links must be updated to the new package directories.

## 🤝 Acknowledgments & Community

Listening and speaking should work together. A heartfelt thank you to [GooDAnDReaDY](https://github.com/GooDAnDReaDY) for [dsh-voice](https://github.com/GooDAnDReaDY/dsh-voice) and [Alan2Z](https://github.com/Alan2Z) for [dsh-speak](https://github.com/Alan2Z/dsh-speak), which inspired this unified coordinator. [Read the full story](HISTORY.md).

I use DSH Live Voice for at least 8 hours every day. Feedback, ideas, and contributions are welcome:
- [Open an Issue](https://github.com/victorwads/dsh-live-voice/issues)
- [Send a Pull Request](https://github.com/victorwads/dsh-live-voice/pulls)

---

real-time meeting transcription, live meeting transcription, AI questions during meetings, meeting assistant, meeting Q&A, shared audio capture, speech-to-text, text-to-speech, local-first voice assistant, DeepSeek Harness plugin.
transcrição de reuniões em tempo real, transcrição ao vivo, perguntas à IA durante reuniões, assistente de reuniões, perguntas e respostas sobre reuniões, captura de áudio compartilhado, reconhecimento de fala, síntese de voz, assistente de voz com prioridade local, plugin para DeepSeek Harness.
实时会议转写、实时语音转文字、会议中向 AI 提问、AI 会议助手、会议问答、共享音频采集、语音识别、语音合成、本地优先语音助手、DeepSeek Harness 插件。

License [Apache-2.0](LICENSE)
