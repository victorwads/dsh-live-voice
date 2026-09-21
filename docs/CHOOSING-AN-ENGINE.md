# Choosing a Speech Recognition Engine

DSH Live Voice brings hands-free voice conversations to DeepSeek Harness (DSH). Because speech recognition (STT) runs local-first, choosing the right engine depends on your **operating system**, **language**, and **available RAM**.

This guide summarizes practical recommendations based on real-world daily use, observed resource footprints, and platform compatibility.

---

## Quick Recommendations

| Language | Platform | Recommended Engine | RAM Footprint | Notes |
| --- | --- | --- | --- | --- |
| **Portuguese (Brazil)** | macOS | **Qwen3 ASR (HTTP API)** | ~3 GB | **Best accuracy.** Maintainer's daily driver. Whisper is second choice. |
| **English (US)** | macOS | **Browser SpeechRecognition** | ~0 GB | Built-in macOS/browser API. Fast and lightweight. |
| **English / Portuguese** | Windows | **Qwen3 ASR** or **Whisper HTTP** | ~2–3 GB | Recommended starting point. Windows browser STT is inconsistent. |
| **Chinese (Mandarin)** | Any | **Qwen3 ASR** or **Whisper HTTP** | ~2–3 GB | Strong multilingual support in underlying models. |
| **Multilingual / Other** | Any | **Whisper HTTP (auto)** | ~2 GB | Automatic language detection (`auto`). |

---

## Engine Breakdown

### 1. Browser SpeechRecognition (Web Speech API)
*Default option in DSH Live Voice settings.*

- **How it works:** Uses the browser's native `SpeechRecognition` interface. On macOS/Chrome/Safari, it can leverage system dictation and locally downloaded language packs.
- **RAM usage:** Negligible (~0 GB extra), since it runs within the browser and operating system frameworks.
- **Strengths:**
  - Zero setup required: no local server or model weights to download.
  - Extremely responsive and lightweight.
  - Outstanding recognition for **English** on macOS.
- **Trade-offs:**
  - Availability and accuracy depend heavily on your browser vendor and operating system.
  - When *Process recognition locally on this device* is checked, your browser must have the language pack installed (e.g. via browser settings or the auto-install prompt).
  - Inconsistent across different platforms (especially Windows).

### 2. Qwen3 ASR (HTTP API)
*Local-first inference via host-local HTTP server (e.g. Apple MLX or OminiX-API).*

- **How it works:** Transcribes bounded audio utterances by posting 16 kHz mono WAV to an OpenAI-compatible `/v1/audio/transcriptions` endpoint running on your machine.
- **RAM usage:** ~3 GB RAM observed during typical local MLX inference.
- **Strengths:**
  - **Highest accuracy for Brazilian Portuguese** in real-world testing.
  - Native support for Portuguese, English, and Chinese.
  - Decoupled from browser quirks and system dictation bugs.
- **Trade-offs:**
  - Requires running a separate local HTTP process (e.g., via Python or MLX).
  - Uses ~3 GB of memory.

### 3. Whisper (HTTP API)
*Local-first inference via whisper.cpp or compatible server.*

- **How it works:** Posts complete audio chunks to a host-local loopback server (e.g., `http://127.0.0.1:8080/inference` or standard `/v1/audio/transcriptions`).
- **RAM usage:** ~2 GB RAM observed in typical setups (e.g., `small` or quantized models).
- **Strengths:**
  - Strong, reliable multilingual recognition across dozens of languages.
  - Supports **Automatic — detect language** (`auto`), switching seamlessly without manual reconfiguration.
  - Highly optimized C/C++ runtimes via `whisper.cpp`.
- **Trade-offs:**
  - Requires running a separate local Whisper server.
  - Transcription is chunk-based rather than real-time streaming.

---

## Platform & OS Guidance

### macOS (Apple Silicon / Intel)
macOS is the primary development and daily-testing platform for DSH Live Voice:
- **For Brazilian Portuguese:** Run **Qwen3 ASR** on Apple MLX. It delivers the most natural transcription with punctuation and handles conversational Portuguese with high precision.
- **For English:** Use **Browser SpeechRecognition**. It uses the native macOS speech synthesis and dictation stack, keeping your RAM free for local LLMs or developer tools.
- **Whisper:** A great fallback if you prefer a single model for multiple languages.

### Windows
- **Browser SpeechRecognition:** Often poorly implemented or inconsistent across Chromium builds on Windows, sometimes requiring external cloud endpoints or failing capability checks.
- **Recommendation:** Use **Qwen3 ASR** or **Whisper HTTP** running locally (e.g. via WSL, Docker, or native Windows binaries).
- *Validation notice:* The maintainer primarily develops and tests on macOS. Windows users are encouraged to test and submit feedback.

---

## Resource & Memory Comparison

| Metric | Browser SpeechRecognition | Whisper HTTP | Qwen3 ASR |
| --- | --- | --- | --- |
| **Additional Process** | None | Separate HTTP server | Separate HTTP server |
| **Typical RAM Usage** | Minimal (~0 GB) | ~2 GB | ~3 GB |
| **Setup Complexity** | Zero configuration | Moderate (run server binary) | Moderate (run MLX/Python server) |
| **Language Detection** | Specific locale only | Manual or `auto` | Manual locale mapping |
| **Local Privacy** | Configurable (local pack or cloud) | 100% local loopback | 100% local loopback |

---

## Language Support Details

1. **Portuguese (Brazil - `pt-BR`):**
   - First-class citizen in DSH Live Voice.
   - Mapped directly as `portuguese` for Qwen3 and `pt` for Whisper.
2. **English (United States - `en-US`):**
   - Full native support across all three engines.
3. **Chinese:**
   - Supported natively by Qwen3 and Whisper backends.
4. **Other Languages:**
   - Select **Whisper HTTP API** with language set to **Automatic — detect language** to speak in Spanish, French, German, Japanese, and more.

---

## Speech Output (TTS) Note

Speech recognition (hearing you) and speech output (speaking back) are configured independently:
- **Browser Speech:** Uses local system voices installed in your OS.
- **macOS `say`:** Native host CLI synthesis. The host renders temporary WAV audio, transcodes it to compact AAC/M4A, removes temporary files, and the browser controls playback.
- **Qwen3 TTS:** High-quality neural synthesis running on the DSH host via MLX; its internal WAV response receives the same AAC/M4A transport conversion.

For both host engines, Live Voice preserves segment order and prepares at most three upcoming segments to reduce gaps. Stop, engine changes, and session teardown cancel or discard obsolete preparation. AAC in an M4A container is the shared browser transport; macOS `afconvert` provides the local conversion without a package dependency.

---

## Help Us Improve

Have you tested DSH Live Voice on Windows, Linux, or in other languages?
Please [open an issue](https://github.com/victorwads/dsh-live-voice/issues) or submit a pull request with your system specifications, engine configuration, and experience!
