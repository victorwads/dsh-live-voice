# DSH Live Voice

[![npm version](https://img.shields.io/npm/v/dsh-live-voice?logo=npm&label=npm&color=brightgreen)](https://www.npmjs.com/package/dsh-live-voice)
[![DSH](https://img.shields.io/badge/DSH-v0.1.6--alpha.2-5c5cff?logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness/releases/tag/v0.1.6-alpha.2)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)

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
| 🇧🇷 **Portuguese on macOS** | **Qwen3 ASR (HTTP API)** | ~3 GB | Best accuracy in daily maintainer use. Whisper is second choice. |
| 🇺🇸 **English on macOS** | **Browser SpeechRecognition** | ~0 GB | Built-in macOS/browser API. Fast, zero extra RAM. |
| 🪟 **Windows** | **Qwen3 ASR** or **Whisper HTTP** | ~2–3 GB | Recommended starting point; Windows browser STT varies. |
| 🌐 **Multilingual / Other** | **Whisper HTTP (auto)** | ~2 GB | Automatic language detection across dozens of languages. |

👉 *For model requirements and server setup, see [Choosing a Speech Engine](docs/CHOOSING-AN-ENGINE.md).*

---

## ✨ Features at a Glance

- 🎙️ **Voice Typing:** Speak directly into the DSH composer with live interim transcription.
- 👐 **Hands-Free Conversation:** Continuous dialogue that stays active across chat sessions.
- ❓ **Spoken Structured Questions:** Narrates DSH prompt questions and submits your spoken answer.
- ⌨️ **Hold-to-Talk (Push-to-Talk):** Hold `Control` anywhere on the page to speak; release to send.
- 🎧 **Acoustic Mode Isolation:** Gated listening for speakers (no echo) and open-mic interruption for headphones.
- 🗣️ **Spoken Commands:** Control the chat using phrases like *"send"*, *"mute"*, *"clear"*, and *"stop speaking"*.
- 🧹 **Smart Code Filtering:** Automatically skips or summarizes large code blocks instead of reading syntax out loud.
- 🏠 **Local-First & Private:** Audio runs locally on your machine (via Browser APIs, Apple MLX, or whisper.cpp); no external voice telemetry.
- 🌐 **Remote-Ready Host Audio:** Qwen and macOS Say synthesize on the DSH host, then DSH delivers compact audio to your browser—so playback works over remote and LAN connections.

### 🧑‍💻 Coming Soon: Meeting Mode

**Meeting Mode** is a planned differentiator for collaborative coding conversations. It will keep two independent live transcription streams in the DSH composer: your microphone as **“Me:”**, and meeting participants from an explicitly shared screen/system-audio stream as **“Them:”**. This creates an editable, real-time record of a code review or technical discussion, so you can manually ask DSH a question with the meeting context already in the composer.

It will never automatically send the transcript or use meeting audio for voice commands. Sharing system audio will always require explicit browser permission and depends on browser and operating-system support.

---

## 🤝 Acknowledgments & Community

Listening and speaking should work together. A heartfelt thank you to [GooDAnDReaDY](https://github.com/GooDAnDReaDY) for [dsh-voice](https://github.com/GooDAnDReaDY/dsh-voice) and [Alan2Z](https://github.com/Alan2Z) for [dsh-speak](https://github.com/Alan2Z/dsh-speak), which inspired this unified coordinator. [Read the full story](HISTORY.md).

I use DSH Live Voice for at least 8 hours every day. Feedback, ideas, and contributions are welcome:
- [Open an Issue](https://github.com/victorwads/dsh-live-voice/issues)
- [Send a Pull Request](https://github.com/victorwads/dsh-live-voice/pulls)

---

### 📄 License [Apache-2.0](LICENSE)
