# DSH Live Voice

[![npm version](https://img.shields.io/npm/v/dsh-live-voice?logo=npm&label=npm&color=brightgreen)](https://www.npmjs.com/package/dsh-live-voice)
[![dsh.pub registry status](https://dsh.pub/api/badges/victorwads/dsh-live-voice.svg)](https://dsh.pub/en/plugins/dsh-live-voice/)
[![license](https://img.shields.io/badge/license-GPL--3.0--only-blue)](LICENSE)

**Local-first speech recognition, voice output, and continuous voice conversations for DSH.**

DSH Live Voice coordinates the microphone, composer, assistant messages, and speech output in one plugin — without letting listening and speaking compete with each other.

## Install

Install the public repository through dsh.pub into your DSH web profile:

```sh
npx dshpub add victorwads/dsh-live-voice --profile web
```

The installer resolves the public repository to an exact commit before adding the bundle. Open **DSH Settings → Live Voice** after the next normal DSH startup.

## Why this project exists and Acknowledgments

Listening and speaking should work together, so you can interrupt and be heard without the assistant’s voice getting in the way. [Read the story behind the project](HISTORY.md).

A heartfelt thank you to [GooDAnDReaDY](https://github.com/GooDAnDReaDY) for [dsh-voice](https://github.com/GooDAnDReaDY/dsh-voice) and [Alan2Z](https://github.com/Alan2Z) for [dsh-speak](https://github.com/Alan2Z/dsh-speak). Your projects solved my voice needs in DSH for a while, and I am grateful for the work you shared. Eventually, I reached a point where I needed one codebase to coordinate both listening and speaking. [Read the full story](HISTORY.md).

## Features

| | Capability |
|---|---|
| 🎙️ | Voice typing directly into the DSH composer |
| 💬 | Continuous voice conversations with automatic assistant speech |
| 🧠 | Browser SpeechRecognition, local loopback whisper.cpp, or Qwen3-ASR on Apple MLX |
| 🔊 | Browser speech synthesis, native macOS `say`, or Qwen3-TTS on Apple MLX |
| ⏱️ | Manual or automatic sending after configurable silence |
| 🫁 | Stable-silence delay prevents breathing pauses from starting assistant speech |
| 🎧 | Open-microphone mode for headphones |
| 🔒 | Gated microphone mode for speakers |
| ✋ | Pause, resume, stop, and manual interruption controls |
| 🔈 | Play individual assistant messages on demand |
| 🏠 | Whisper audio reaches the local server only through the authenticated DSH host |

## Conversation flow

The assistant never starts automatic playback while you are speaking. If a response is already waiting — including another assistant message — it waits until you finish and the configured continuous-silence delay has passed.

### Speakers — gated listening (default)

Listening and playback take turns so the assistant does not hear its own voice.

```mermaid
sequenceDiagram
    participant Interface
    actor Você
    actor Assistente

    Note over Interface,Assistente: Aguardando você falar…
    activate Você
    Você->>Assistente: Começa a falar
    Assistente-->>Você: Escuta enquanto você fala
    Note over Interface,Assistente: Você parou de falar
    opt Envio manual
        Você->>Interface: Revisa a mensagem reconhecida
        Interface-->>Você: Envia quando estiver pronto
    end
    opt Envio automático
        Note over Você,Assistente: Envia após a contagem de silêncio
    end
    deactivate Você
    Você->>Assistente: Entrega sua mensagem
    Assistente-->>Você: Resposta pronta — aguarda silêncio contínuo
    Assistente-->>Você: Para de escutar
    activate Assistente
    Assistente->>Você: Fala a resposta em voz alta
    deactivate Assistente
    Note over Interface,Assistente: Escutando novamente — aguardando você falar…
```

### Headphones — open microphone

The microphone remains open during playback, allowing your voice to pause the assistant.


### Other conversation settings

- **Sending mode:** review and send manually by default, or send automatically after a configurable silence countdown.
- **Assistant response delay:** choose how long you must remain silent before automatic playback starts; speaking again restarts the wait.
- **Automatic assistant speech:** turn automatic playback of new assistant messages on or off.
- **Sent-message interruption:** sending another message does not stop current audio by default, but you can enable that behavior.
- **Manual playback:** play any individual assistant message on demand without waiting for the automatic-playback delay.

## Local-first architecture

- **Recognition:** Browser SpeechRecognition, loopback whisper.cpp HTTP, or Qwen3-ASR through a host-local Apple MLX server.
- **Speech output:** browser/device audio, native macOS `say`, or host-local Qwen3-TTS with WAV playback in the browser.
- **Whisper transport:** complete WAV utterances through authenticated same-origin DSH routes.
- **Privacy:** raw audio and transcripts are not logged by default.

Speech processing can run locally, but the DSH language model may still be remote.

## Qwen3 HTTP engine

When a compatible Qwen3 speech API is already running on the DSH host, choose **Qwen3 ASR — local MLX server** under Speech recognition and **Qwen3 TTS — local MLX server** under Speech output. Configure its base URL in **DSH Settings → Live Voice**. The Qwen server may use any HTTP or HTTPS base URL reachable from the DSH host. The plugin supports the OminiX-API contract and standard OpenAI-style speech endpoints at `GET /health`, `POST /v1/audio/transcriptions`, and `POST /v1/audio/speech`; it does not install, start, stop, or manage that external service or its model weights.

## License

[GPL-3.0-only](LICENSE). Commercial use and redistribution are allowed subject to the GPL. Third-party speech engines and models may have separate licenses.

## Keywords

`dsh`, `dsh-plugin`, `deepseek-harness`, `local-first`, `local-voice`, `voice-assistant`, `voice-conversation`, `continuous-conversation`, `voice-dictation`, `speech-to-text`, `text-to-speech`, `speech-recognition`, `speech-synthesis`, `stt`, `tts`, `whisper`, `whisper-cpp`, `web-speech-api`, `macos-say`, `turn-taking`, `voice-interruption`, `silence-detection`
