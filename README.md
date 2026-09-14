# DSH Live Voice

[![npm version](https://img.shields.io/npm/v/dsh-live-voice/developing?logo=npm&label=npm)](https://www.npmjs.com/package/dsh-live-voice)

**Local-first voice conversations for DSH.**

Designed to run speech recognition (speech-to-text, STT) and speech synthesis (text-to-speech, TTS) on your own machine, with optional external providers. The goal is a single plugin that coordinates listening and speaking, rather than two independent voice tools competing for the microphone and speakers.

### Why this project exists and Acknowledgments

Listening and speaking should work together, so you can interrupt and be heard without the assistant’s voice getting in the way. [Read the story behind the project](HISTORY.md).

A heartfelt thank you to [GooDAnDReaDY](https://github.com/GooDAnDReaDY) for [dsh-voice](https://github.com/GooDAnDReaDY/dsh-voice) and [Alan2Z](https://github.com/Alan2Z) for [dsh-speak](https://github.com/Alan2Z/dsh-speak). Your projects solved my voice needs in DSH for a while, and I am grateful for the work you shared. Eventually, I reached a point where I needed one codebase to coordinate both listening and speaking. [Read the full story](HISTORY.md).

## Features and Plans

See [the feature plan and proposed architecture](PLAN.md) for conversation modes, interruption and resumption, engine selection, and the implementation approach.

Version `0.0.1-developing` is a documentation-only development placeholder. The experience described here is a goal, not an implemented feature.. yet... wait for next days...


## Licensing

[GNU GPL version 3 only](LICENSE) (`GPL-3.0-only`). Commercial use and redistribution are allowed subject to the GPL, including its corresponding-source requirements when distributing covered software. Third-party engines and models may have separate licenses.

## Keywords

`dsh`, `local-first`, `local-voice`, `voice-conversation`, `speech-to-text`, `text-to-speech`, `speech-recognition`, `speech-synthesis`, `stt`, `tts`, `turn-taking`, `voice-interruption`
