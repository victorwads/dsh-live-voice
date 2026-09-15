# Development and local testing

```sh
npm ci
npm run typecheck
npm test
npm run build
```

Implementation, test, and build-script source is TypeScript (`.ts`). `npm run typecheck` compiles the TypeScript project; `npm test` typechecks, builds the browser and host bundles, transpiles the TypeScript tests, then runs them. Tests exercise engines, coordination, transcript edits, RPC, configuration, and UI contracts, but do not record the microphone. `npm run dev` watches the browser and host bundles only; it is not a replacement DSH server.

## Current local installation

Install through the official CLI only:

```sh
dsh plugin add --profile web link:/Users/bizup/GitRepos/dsh-live-voice
```

The CLI registers the bundle, which loads this package’s own patch. Do not add a second `insert` for `dsh-live-voice` in the profile YAML: it causes a duplicate loader entry and prevents startup. The earlier manual activation workaround has been withdrawn. The plugin uses public `connection.fetch.register` routes below `/api/dsh-live-voice`, preserving the existing DSH authentication carrier. Only `connection` injection is needed. Adding `webServer` did not fix the custom-channel context error in the installed SDK; the custom channel was removed. Linked server source changes apply on the next normal DSH startup; a browser refresh alone does not reload server code.

After rebuilding, refresh the existing authenticated DSH page. No automatic HMR guarantee is made. The existing URL remains http://127.0.0.1:3080. Unauthenticated HTTP requests return 401; never bypass this or extract credentials to test the plugin.

## First use

Open DSH Settings → Live Voice. Speech output, Speech recognition, and Conversation are separate collapsible cards; provider and Voice detection controls are nested collapsible sections. Preferences are stored in this browser; changing them stops active voice resources, saves immediately, and applies to the next operation. The Conversation card controls automatic announcement of new assistant messages during voice conversations; it is enabled by default, and playback waits while speech recognition reports user activity. Listening mode has a selection-specific explanation: Speakers/gated releases capture during playback, while Headphones/open microphone keeps capture available for interruption. Sending mode defaults to Manual. Automatic mode waits 4 seconds by default after a final recognized phrase (configurable from 2 to 10 seconds), displays a cancellable countdown in the voice bar, and uses the normal public DSH input submission action. New speech or an edited draft cancels the pending send. Separately, **Assistant response delay** requires continuous silence after detected user speech before queued automatic playback begins (default 3 seconds, configurable from 1 to 10); renewed speech restarts that wait. Manual per-message playback is not delayed. Sending another user message also leaves current assistant audio playing by default. Enable **Stop assistant speech when I send a message** to opt into interruption on a newly observed user or steering turn; loaded history does not trigger it. Choose browser speech (local voices only) or macOS say (plays through the host device). Choose Browser SpeechRecognition or Whisper HTTP, the recognition language, and speaker/headphone mode.

- Microphone: dictate into the editable composer. Stop keeps the text; cancel removes only an unchanged interim hypothesis.
- Conversation: continuous recognition plus spoken new assistant text. Review the composer and use the existing DSH Send control. There is no automatic send.
- Speakers: recognition is gated during playback. Use Take microphone to interrupt.
- Headphones: speech activity pauses playback. Resume is explicit, never triggered just by silence.
- Global Stop speech cancels remaining speech. End conversation stops capture, recognition and playback, but not agent text generation.
- Per-message speaker controls replay only the addressed visible assistant message.
- Ctrl+Shift+Space works with the page focused when a single composer is active, not globally across the OS.

## Privacy and compatibility

Browser recognition can be configured for on-device processing or the browser recognition service. In local mode the user may allow the browser-native language-pack installation flow. The UI warns when browser-service processing may transmit microphone audio. The waveform analyser remains local.

Whisper HTTP is host-side. In DSH Settings → Live Voice, choose **Whisper HTTP — DSH host** under Speech recognition. Provider-specific fields appear directly inside a single **Connection settings** subcard, without repeating the selected engine name or nesting an additional connection box. A nested **Silence detection** subcard appears inside Speech recognition only for engines whose audio is captured and segmented by this plugin. It exposes three simple pause profiles: Short (900 ms), Natural (1500 ms, default), and Long (2200 ms). Browser SpeechRecognition does not show this block because the browser controls its segmentation. Recognition language is sent to the active provider: Whisper HTTP adds **Automatic — detect language** and sends `auto` to whisper.cpp; Browser SpeechRecognition requires a concrete language and does not show Automatic. The provider panel exposes the inference endpoint URL, health URL/path, and request timeout, plus **Test connection**, **Save Whisper settings**, and **Reload saved settings**. Saved settings live only on the DSH host in `~/.dsh/dsh-live-voice-whisper.json` (owner-only permissions), never in browser storage; only unauthenticated loopback HTTP URLs are accepted. The default inference endpoint is `http://127.0.0.1:8080/inference`. The legacy `DSH_LIVE_VOICE_WHISPER_URL` remains the initial default before host settings are saved. The browser reuses the microphone stream, applies the selected pause profile (or a 20-second maximum), resamples to mono 16 kHz PCM16 WAV, and posts bounded utterances to DSH’s authenticated `/api/dsh-live-voice/whisper/transcribe` route. DSH validates the WAV and forwards it as multipart `file` to whisper.cpp. Current whisper.cpp HTTP accepts only complete files and returns one final transcript; it has no WebSocket, SSE, or true realtime input protocol, so the plugin does not falsely label this engine as streaming.

macOS say uses a private temporary text file and remains active until the child closes and cleanup finishes. The host RPC carries no persistent transcript log. Browser output accepts only voices explicitly marked local. Browser and host may be different devices.

## Observed browser capability

An isolated headless instance of the installed Chrome 152 reported `processLocally` and the availability API, but `pt-BR` and `en-US` were `downloadable`, not `available`. No download or recording was performed. This isolated profile does not establish whether the maintainer’s normal browser profile already has those packs. Run `node --experimental-strip-types scripts/probe-browser.ts` to repeat this capability-only check using the installed macOS Chrome.

`node --experimental-strip-types scripts/preview-ui.ts` produces an isolated component screenshot with a synthetic meter level, not a screenshot of the authenticated DSH GUI.

## Manual acceptance still required

In the authenticated DSH page, verify controls appear once, settings open/close, say play/pause/resume/stop, browser voice discovery, microphone permissions, local recognition availability, waveform, typing during dictation, cancellation, speaker/headphone interruption, streaming, session switching and narrow-screen layout. The maintainer removes older voice plugins.

Automated tests use fake speech resources and never invoke audible system playback. Actual browser microphone recognition, host speech output, and speaker audibility require an explicit manual check and must not be claimed verified by automated tests.
