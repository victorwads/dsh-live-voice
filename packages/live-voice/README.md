# DSH Live Voice

Release history: [repository changelog](https://github.com/victorwads/dsh-live-voice/blob/main/CHANGELOG.md).

[![npm version](https://img.shields.io/npm/v/dsh-live-voice?logo=npm&label=npm&color=brightgreen)](https://www.npmjs.com/package/dsh-live-voice)
[![Tested DSH](https://img.shields.io/badge/Tested_DSH-v0.2.1--alpha.1-5c5cff?logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-alpha.1)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)

**Tested and working with DeepSeek Harness v0.2.1-alpha.1.** This is the current tested DSH version, recorded in the `dshTestedVersion` field in [package.json](package.json).

**A local-first, hands-free voice assistant plugin for DeepSeek Harness (DSH).**
*Built in Brazil 🇧🇷 and tested daily with Brazilian Portuguese on macOS.*

Speak, listen, answer prompts, and code without touching your keyboard. DSH Live Voice coordinates speech-to-text (STT) and text-to-speech (TTS) into a single, conflict-free conversational flow.

---

## ⚡ Quick Start

Install with `npx dsh` into your DSH web profile:

```sh
npx dsh plugin add --profile web dsh-live-voice
```

Open **DSH Settings → Live Voice** after your next DSH startup.

---

## 🌍 Interface Languages

DSH Live Voice’s plugin interface is translated into the following languages. This refers to the visible plugin UI—not speech-recognition or text-to-speech language support.

- 🇺🇸 **English**
- 🇧🇷 **Portuguese (Brazil)**
- 🇪🇸 **Spanish**
- 🇫🇷 **French**
- 🇮🇳 **Hindi**
- 🇨🇳 **Chinese**

---

## 📚 Documentation

Detailed guides for deep-diving into engines and configurations:

- ⚙️ **[Configuration & Conversation Flow Guide](docs/CONFIGURATION.md)** — Settings overview, speaker vs. headphone modes, sequence diagrams, silence delays, and external engine setup.
- 🧠 **[Choosing a Speech Recognition Engine](docs/CHOOSING-AN-ENGINE.md)** — Comparison between Browser STT, Qwen3 ASR, and Whisper, with RAM footprints and OS compatibility.
- 📖 **[The Story Behind the Project](HISTORY.md)** — Why this project was built and the human story behind coordinating voice.

---

## 🎯 Which Speech Engine Should I Use?

| Scenario | Recommendation | RAM | Why |
| --- | --- | --- | --- |
| 🇧🇷 **Portuguese on macOS** | **Qwen3 ASR (HTTP API)** | ~1.5 GB | Best accuracy in daily maintainer use; current RAM usage reported by the maintainer. Whisper is second choice. |
| 🇺🇸 **English on macOS** | **Browser SpeechRecognition** | ~0 GB | Built-in macOS/browser API. Fast, zero extra RAM. |
| 🪟 **Windows** | **Qwen3 ASR** or **Whisper HTTP** | ~2–3 GB | Recommended starting point; Windows browser STT varies. |
| 🌐 **Multilingual / Other** | **Whisper HTTP (auto)** | ~2 GB | Automatic language detection across dozens of languages. |

👉 *For model requirements and server setup, see [Choosing a Speech Engine](docs/CHOOSING-AN-ENGINE.md).*

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
- 🏠 **Local-First & Private:** Audio runs locally on your machine (via Browser APIs, Apple MLX, or whisper.cpp); no external voice telemetry.
- 🌐 **Remote-Ready Host Audio:** Qwen and macOS Say synthesize on the DSH host, then DSH delivers compact audio to your browser—so playback works over remote and LAN connections.

### 🧑‍💻 Meeting Mode — Shared Audio Alongside Normal Voice

Select **Qwen HTTP** or **Whisper HTTP** recognition, then click the shared-audio icon beside the composer microphone. The first click opens the browser sharing dialog directly; enable audio in that dialog. The shared source gets its own recognition bar, using the same component as normal microphone recognition, without replacing microphone controls or assistant speech playback. Click the shared-audio toggle again to stop only that source. When all three bars are visible, speech/live captions come first, shared audio second, and microphone recognition last, separated by 2px. The microphone bar has one listening/ignoring toggle on the left; queue position appears only in the speech bar, while the automatic-speech toggle remains available in the composer between shared audio and microphone.

Normal microphone behavior, voice commands, delivery settings, and speech output remain available. The composer microphone remains a toggle while capturing, and either source can be stopped independently. The shared-audio bar also has a **Timestamp** clock toggle, off by default: new `Me:`/`Them:` blocks can include `[YYYY/MM/DD HH:MM:SS]` using the local machine time at chunk onset, not recognition completion. Consecutive chunks from the same source retain the existing block, and toggling timestamps never rewrites earlier text. With both sources capturing, source changes introduce **“Me:”** or **“Them:”**; consecutive chunks continue on new lines without repeating labels. Shared audio appends final transcripts but never triggers voice commands or automatic sending itself. Microphone transcripts retain the configured sending behavior.

Browser/OS support and the chosen sharing surface determine whether audio is available. Headphones are recommended to avoid unintended feedback when letting the agent speak into a shared meeting or tab. Automated capture, composer and UI tests do not replace real microphone/shared-audio validation.

---

## 🤝 Acknowledgments & Community

Listening and speaking should work together. A heartfelt thank you to [GooDAnDReaDY](https://github.com/GooDAnDReaDY) for [dsh-voice](https://github.com/GooDAnDReaDY/dsh-voice) and [Alan2Z](https://github.com/Alan2Z) for [dsh-speak](https://github.com/Alan2Z/dsh-speak), which inspired this unified coordinator. [Read the full story](HISTORY.md).

I use DSH Live Voice for at least 8 hours every day. Feedback, ideas, and contributions are welcome:
- [Open an Issue](https://github.com/victorwads/dsh-live-voice/issues)
- [Send a Pull Request](https://github.com/victorwads/dsh-live-voice/pulls)

---

### 📄 License [Apache-2.0](LICENSE)
