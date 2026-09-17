// src/engines/speaking/say.ts
import { spawn as nodeSpawn } from "node:child_process";
import * as nodeFs from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
function failure(message, code, cause) {
  return Object.assign(new Error(message, cause === void 0 ? void 0 : { cause }), { code });
}
function aborted(reason) {
  return Object.assign(
    new Error("Speech cancelled", reason === void 0 ? void 0 : { cause: reason }),
    {
      name: "AbortError",
      code: "ABORT_ERR"
    }
  );
}
var SayEngine = class {
  #spawn;
  #fs;
  #platform;
  #tempRoot;
  #killAfterMs;
  #closeAfterMs;
  #tail = Promise.resolve();
  #requests = /* @__PURE__ */ new Set();
  #active = null;
  #unclosed = null;
  #state = "idle";
  #lastError = null;
  constructor({
    spawn = nodeSpawn,
    fs = nodeFs,
    platform = process.platform,
    tempRoot = tmpdir(),
    killAfterMs = 250,
    closeAfterMs = 1e3
  } = {}) {
    for (const value of [killAfterMs, closeAfterMs]) {
      if (!Number.isFinite(value) || value < 0 || value > 2147483647) {
        throw new TypeError("Cancellation deadlines must be finite nonnegative milliseconds");
      }
    }
    this.#spawn = spawn;
    this.#fs = fs;
    this.#platform = platform;
    this.#tempRoot = tempRoot;
    this.#killAfterMs = killAfterMs;
    this.#closeAfterMs = closeAfterMs;
  }
  get state() {
    return this.#state;
  }
  get lastError() {
    return this.#lastError;
  }
  /** Checks the host executable, not browser support or installed voices. */
  async getCapabilities() {
    if (this.#platform !== "darwin") {
      return { supported: false, pause: false, resume: false, reason: "unsupported-platform" };
    }
    try {
      await this.#fs.access("/usr/bin/say", constants.X_OK);
      return { supported: true, pause: true, resume: true, reason: null };
    } catch {
      return { supported: false, pause: false, resume: false, reason: "executable-unavailable" };
    }
  }
  speak(text, { voice, rate, signal } = {}) {
    if (typeof text !== "string") return Promise.reject(new TypeError("text must be a string"));
    if (voice !== void 0 && (typeof voice !== "string" || !voice.trim() || voice.includes("\0"))) {
      return Promise.reject(new TypeError("voice must be a nonempty string without NUL"));
    }
    if (rate !== void 0 && (!Number.isFinite(rate) || rate <= 0)) {
      return Promise.reject(new TypeError("rate must be a positive finite number"));
    }
    if (signal !== void 0 && (signal === null || typeof signal.addEventListener !== "function" || typeof signal.removeEventListener !== "function" || typeof signal.aborted !== "boolean")) {
      return Promise.reject(new TypeError("signal must be an AbortSignal"));
    }
    for (const request2 of this.#requests) this.#cancel(request2);
    const request = { cancelled: false, reason: void 0, cancelChild: null };
    const onAbort = () => this.#cancel(request, signal.reason);
    this.#requests.add(request);
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) onAbort();
    const result = this.#tail.then(() => this.#run(request, text, voice, rate));
    const settled = result.finally(() => {
      signal?.removeEventListener("abort", onAbort);
      this.#requests.delete(request);
    });
    this.#tail = settled.catch(() => {
    });
    return settled;
  }
  /** Resolves after queued requests and cleanup; rejects teardown failures. */
  async stop() {
    for (const request of this.#requests) this.#cancel(request);
    const pending = this.#tail;
    await pending;
    if (this.#unclosed || this.#state === "error") throw this.#lastError;
  }
  pause() {
    return this.#control("speaking", "paused", "SIGSTOP");
  }
  resume() {
    return this.#control("paused", "speaking", "SIGCONT");
  }
  #control(from, to, signal) {
    if (this.#platform !== "darwin" || this.#state !== from || !this.#active?.child || this.#active.cancelled)
      return false;
    try {
      if (!this.#active.child.kill(signal))
        throw failure("Unable to signal speech process", "SAY_SIGNAL_FAILED");
      this.#state = to;
      return true;
    } catch (error) {
      this.#lastError = error;
      return false;
    }
  }
  #cancel(request, reason) {
    if (request.cancelled) return;
    request.cancelled = true;
    request.reason = reason;
    request.cancelChild?.();
  }
  async #run(request, text, voice, rate) {
    let directory;
    let error;
    const check = () => {
      if (request.cancelled) throw aborted(request.reason);
    };
    try {
      check();
      if (this.#unclosed)
        throw failure("Previous speech process has not closed", "SAY_PROCESS_UNCLOSED");
      this.#active = request;
      this.#state = "preparing";
      this.#lastError = null;
      const capability = await this.getCapabilities();
      check();
      if (!capability.supported) throw failure("macOS say is unavailable", "SAY_UNAVAILABLE");
      directory = await this.#fs.mkdtemp(join(this.#tempRoot, "dsh-live-voice-say-"));
      check();
      await this.#fs.chmod(directory, 448);
      const file = join(directory, "speech.txt");
      await this.#fs.writeFile(file, text, { encoding: "utf8", mode: 384, flag: "wx" });
      await this.#fs.chmod(file, 384);
      check();
      const args = ["-f", file];
      if (voice !== void 0) args.push("-v", voice);
      if (rate !== void 0) args.push("-r", String(rate));
      const child = this.#spawn("/usr/bin/say", args, { shell: false, stdio: "ignore" });
      request.child = child;
      this.#state = "speaking";
      await this.#waitForClose(request, child);
      check();
    } catch (caught) {
      error = caught;
    } finally {
      request.cancelChild = null;
      if (directory) {
        try {
          await this.#fs.rm(directory, { recursive: true, force: true });
        } catch (cleanupError) {
          error = failure(
            "Speech temporary-file cleanup failed",
            "SAY_CLEANUP_FAILED",
            error ? new AggregateError([error, cleanupError]) : cleanupError
          );
        }
      }
      if (!error && request.cancelled) error = aborted(request.reason);
      if (this.#active === request) this.#active = null;
      if (error && error.name !== "AbortError") {
        this.#state = "error";
        this.#lastError = error;
      } else if (!this.#unclosed && this.#state !== "error") this.#state = "idle";
    }
    if (error) throw error;
  }
  #waitForClose(request, child) {
    return new Promise((resolve, reject) => {
      let closed = false;
      let processError;
      let killTimer;
      let closeTimer;
      const send = (signal) => {
        try {
          if (!child.kill(signal))
            processError ??= failure("Unable to signal speech process", "SAY_SIGNAL_FAILED");
        } catch (error) {
          processError ??= error;
        }
      };
      const onError = (error) => {
        processError ??= error;
      };
      child.on("error", onError);
      child.once("close", (code, signal) => {
        closed = true;
        clearTimeout(killTimer);
        clearTimeout(closeTimer);
        child.removeListener("error", onError);
        if (this.#unclosed === child) this.#unclosed = null;
        if (request.cancelled) reject(aborted(request.reason));
        else if (processError) reject(processError);
        else if (code !== 0)
          reject(
            failure("Speech process exited unsuccessfully", "SAY_EXIT_FAILED", { code, signal })
          );
        else resolve();
      });
      request.cancelChild = () => {
        if (closed) return;
        const paused = this.#state === "paused";
        this.#state = "stopping";
        if (paused) send("SIGCONT");
        send("SIGTERM");
        if (closed) return;
        killTimer = setTimeout(() => {
          send("SIGKILL");
          if (closed) return;
          closeTimer = setTimeout(() => {
            if (closed) return;
            this.#unclosed = child;
            reject(
              failure(
                "Speech process did not close after cancellation",
                "SAY_STOP_TIMEOUT",
                processError
              )
            );
          }, this.#closeAfterMs);
        }, this.#killAfterMs);
      };
      if (request.cancelled) request.cancelChild();
    });
  }
};

// src/engines/recognition/whisper-http-host.ts
import { readFile, mkdir, writeFile, rename, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join as join2 } from "node:path";
import { randomUUID } from "node:crypto";
var LOOPBACK = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
function validateWhisperConfig(value) {
  if (!value || typeof value.url !== "string" || typeof value.healthUrl !== "string")
    throw new Error("Endpoint URL and health URL/path are required.");
  const url = resolveWhisperUrl(value.url.trim());
  const health = value.healthUrl.trim();
  if (!health) throw new Error("Health URL/path is required.");
  resolveWhisperUrl(new URL(health, url).href);
  if (!Number.isInteger(value.timeoutMs) || value.timeoutMs < 100 || value.timeoutMs > 3e5)
    throw new Error("Request timeout must be an integer between 100 and 300000 ms.");
  return { url: url.href, healthUrl: health, timeoutMs: value.timeoutMs };
}
function createWhisperConfigStore(path = join2(homedir(), ".dsh", "dsh-live-voice-whisper.json")) {
  return {
    async load() {
      try {
        return JSON.parse(await readFile(path, "utf8"));
      } catch (error) {
        if (error.code === "ENOENT") return null;
        throw new Error("Cannot read persisted Whisper settings: " + error.message);
      }
    },
    async save(config) {
      await mkdir(dirname(path), { recursive: true, mode: 448 });
      const temporary = path + "." + randomUUID() + ".tmp";
      try {
        await writeFile(temporary, JSON.stringify(config, null, 2) + "\n", {
          mode: 384,
          flag: "wx"
        });
        await rename(temporary, path);
      } finally {
        await rm(temporary, { force: true });
      }
    }
  };
}
var clean = (value) => String(value ?? "").trim();
function resolveWhisperUrl(value = process.env.DSH_LIVE_VOICE_WHISPER_URL || "http://127.0.0.1:8080/inference") {
  const url = new URL(value);
  if (url.protocol !== "http:" || !LOOPBACK.has(url.hostname) || url.username || url.password || url.hash)
    throw new Error("Whisper HTTP URL must be an unauthenticated loopback http URL.");
  return url;
}
function validateMonoPcm16Wav(input, { maxBytes = 2e6 } = {}) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.byteLength < 44 || bytes.byteLength > maxBytes)
    throw new Error("Invalid or oversized WAV recording.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), ascii = (at2, n) => String.fromCharCode(...bytes.subarray(at2, at2 + n));
  if (ascii(0, 4) !== "RIFF" || ascii(8, 4) !== "WAVE" || view.getUint32(4, true) + 8 !== bytes.byteLength)
    throw new Error("Invalid WAV container.");
  let at = 12, fmt = null, data = null;
  while (at + 8 <= bytes.byteLength) {
    const id = ascii(at, 4), size = view.getUint32(at + 4, true), start = at + 8, end = start + size;
    if (end > bytes.byteLength) throw new Error("Invalid WAV chunk.");
    if (id === "fmt ") fmt = { start, size };
    if (id === "data") {
      if (data) throw new Error("Multiple WAV data chunks are unsupported.");
      data = { start, size };
    }
    at = end + (size & 1);
  }
  if (!fmt || fmt.size < 16 || !data || at !== bytes.byteLength)
    throw new Error("Incomplete WAV recording.");
  const f = fmt.start;
  if (view.getUint16(f, true) !== 1 || view.getUint16(f + 2, true) !== 1 || view.getUint32(f + 4, true) !== 16e3 || view.getUint32(f + 8, true) !== 32e3 || view.getUint16(f + 12, true) !== 2 || view.getUint16(f + 14, true) !== 16 || data.size < 2 || data.size % 2)
    throw new Error("WAV must be mono 16 kHz PCM16.");
  return bytes;
}
var WhisperHttpHost = class {
  constructor({
    url,
    healthUrl = "/health",
    timeoutMs = 3e4,
    fetchImpl = globalThis.fetch,
    maxBytes = 2e6,
    store
  } = {}) {
    this.config = validateWhisperConfig({ url: resolveWhisperUrl(url).href, healthUrl, timeoutMs });
    this.fetch = fetchImpl;
    this.maxBytes = maxBytes;
    this.store = store;
    this.active = new AbortController();
    this.queue = Promise.resolve();
    this.ready = Promise.resolve().then(async () => {
      const saved = await store?.load();
      if (saved) this.config = validateWhisperConfig(saved);
    }).catch((error) => {
      this.loadError = error;
    });
  }
  get url() {
    return new URL(this.config.url);
  }
  async getConfig() {
    await this.ready;
    if (this.loadError) throw this.loadError;
    return { ...this.config };
  }
  replaceConfig(value) {
    const next = validateWhisperConfig(value);
    const operation = this.queue.then(async () => {
      await this.ready;
      await this.store?.save(next);
      this.active.abort();
      this.active = new AbortController();
      this.config = next;
      this.loadError = null;
      return { ...next };
    });
    this.queue = operation.catch(() => {
    });
    return operation;
  }
  dispose() {
    this.active.abort();
  }
  async request(url, options, config, consume = (response) => response) {
    const timeout = AbortSignal.timeout(config.timeoutMs);
    const signal = AbortSignal.any([
      timeout,
      this.active.signal,
      ...options.signal ? [options.signal] : []
    ]);
    const response = await this.fetch(url, { ...options, signal, redirect: "error" });
    const value = await consume(response);
    signal.throwIfAborted();
    return value;
  }
  async capability(signal, configuration) {
    try {
      const config = configuration ? validateWhisperConfig(configuration) : await this.getConfig();
      const response = await this.request(
        new URL(config.healthUrl, config.url),
        { signal },
        config
      );
      return response.ok ? { supported: true, local: true, streaming: false, maxBytes: this.maxBytes } : {
        supported: false,
        local: true,
        streaming: false,
        reason: "Whisper HTTP health check failed (" + response.status + ")."
      };
    } catch (error) {
      return {
        supported: false,
        local: true,
        streaming: false,
        reason: "Whisper HTTP server is unreachable: " + (error?.message || error)
      };
    }
  }
  async transcribe(input, { lang = "auto", signal } = {}) {
    const bytes = validateMonoPcm16Wav(input, { maxBytes: this.maxBytes }), form = new FormData();
    form.append("file", new Blob([bytes], { type: "audio/wav" }), "utterance.wav");
    form.append("response_format", "json");
    form.append("language", lang.startsWith("pt") ? "pt" : lang.startsWith("en") ? "en" : "auto");
    const config = await this.getConfig();
    return this.request(
      new URL(config.url),
      { method: "POST", body: form, signal },
      config,
      async (response) => {
        if (!response.ok)
          throw new Error("Whisper HTTP transcription failed (" + response.status + ").");
        const json = await response.json();
        return { text: clean(json?.text) };
      }
    );
  }
};

// src/engines/qwen-http-host.ts
import { readFile as readFile2, mkdir as mkdir2, writeFile as writeFile2, rename as rename2, rm as rm2 } from "node:fs/promises";
import { homedir as homedir2 } from "node:os";
import { dirname as dirname2, join as join3 } from "node:path";
import { randomUUID as randomUUID2 } from "node:crypto";

// src/core/settings.ts
var voiceDetectionPresets = Object.freeze({
  short: Object.freeze({
    silenceMs: 900,
    label: "Short",
    description: "Send quickly after a short pause."
  }),
  natural: Object.freeze({
    silenceMs: 1500,
    label: "Natural",
    description: "Allow normal pauses between phrases."
  }),
  long: Object.freeze({
    silenceMs: 2200,
    label: "Long",
    description: "Wait through longer thinking pauses."
  })
});
var qwenVoices = Object.freeze([
  Object.freeze({ value: "aiden", label: "Aiden \u2014 male, American English" }),
  Object.freeze({ value: "ryan", label: "Ryan \u2014 male, English" }),
  Object.freeze({ value: "uncle_fu", label: "Uncle Fu \u2014 male, Chinese" }),
  Object.freeze({ value: "dylan", label: "Dylan \u2014 male, Beijing Chinese" }),
  Object.freeze({ value: "eric", label: "Eric \u2014 male, Sichuan Chinese" }),
  Object.freeze({ value: "vivian", label: "Vivian \u2014 female, Chinese" }),
  Object.freeze({ value: "serena", label: "Serena \u2014 female, Chinese" }),
  Object.freeze({ value: "ono_anna", label: "Ono Anna \u2014 female, Japanese" }),
  Object.freeze({ value: "sohee", label: "Sohee \u2014 female, Korean" })
]);
var defaultQwenVoice = qwenVoices[0].value;
var isQwenVoice = (value) => qwenVoices.some((voice) => voice.value === value);
var defaultSettings = Object.freeze({
  engine: "browser",
  recognitionEngine: "browser",
  recognitionProcessLocally: true,
  recognitionAutoInstall: true,
  voiceDetectionPreset: "natural",
  announceAssistantMessages: true,
  interruptSpeechOnUserMessage: false,
  sendingMode: "manual",
  autoSendDelaySeconds: 4,
  assistantSpeechDelaySeconds: 3,
  mode: "speaker",
  lang: "pt-BR",
  recognitionLang: "pt-BR",
  voice: "",
  inputDeviceId: "",
  outputDeviceId: "",
  rate: 1
});

// src/engines/qwen-http-host.ts
var clean2 = (value) => String(value ?? "").trim();
function resolveQwenBaseUrl(value = process.env.DSH_LIVE_VOICE_QWEN_URL || "http://127.0.0.1:8080/") {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("Qwen API URL must use HTTP or HTTPS.");
  url.pathname = url.pathname.replace(/\/*$/, "/");
  url.search = "";
  url.hash = "";
  return url;
}
function validateQwenConfig(value) {
  if (!value || typeof value.baseUrl !== "string")
    throw new Error("Qwen API base URL is required.");
  const baseUrl = resolveQwenBaseUrl(value.baseUrl.trim());
  if (!Number.isInteger(value.timeoutMs) || value.timeoutMs < 1e3 || value.timeoutMs > 6e5)
    throw new Error("Request timeout must be an integer between 1000 and 600000 ms.");
  return { baseUrl: baseUrl.href, timeoutMs: value.timeoutMs };
}
function createQwenConfigStore(path = join3(homedir2(), ".dsh", "dsh-live-voice-qwen.json")) {
  return {
    async load() {
      try {
        return JSON.parse(await readFile2(path, "utf8"));
      } catch (error) {
        if (error.code === "ENOENT") return null;
        throw new Error("Cannot read persisted Qwen settings: " + error.message);
      }
    },
    async save(config) {
      await mkdir2(dirname2(path), { recursive: true, mode: 448 });
      const temporary = path + "." + randomUUID2() + ".tmp";
      try {
        await writeFile2(temporary, JSON.stringify(config, null, 2) + "\n", {
          mode: 384,
          flag: "wx"
        });
        await rename2(temporary, path);
      } finally {
        await rm2(temporary, { force: true });
      }
    }
  };
}
var language = (value) => value === "auto" ? void 0 : value?.toLowerCase().startsWith("pt") ? "portuguese" : value?.toLowerCase().startsWith("en") ? "english" : value;
var QwenHttpHost = class {
  constructor({
    baseUrl,
    timeoutMs = 3e5,
    fetchImpl = globalThis.fetch,
    maxBytes = 2e6,
    maxSpeechBytes = 5e7,
    store
  } = {}) {
    this.config = validateQwenConfig({ baseUrl: resolveQwenBaseUrl(baseUrl).href, timeoutMs });
    this.fetch = fetchImpl;
    this.maxBytes = maxBytes;
    this.maxSpeechBytes = maxSpeechBytes;
    this.store = store;
    this.active = new AbortController();
    this.queue = Promise.resolve();
    this.ready = Promise.resolve().then(async () => {
      const saved = await store?.load();
      if (saved) this.config = validateQwenConfig(saved);
    }).catch((error) => {
      this.loadError = error;
    });
  }
  async getConfig() {
    await this.ready;
    if (this.loadError) throw this.loadError;
    return { ...this.config };
  }
  replaceConfig(value) {
    const next = validateQwenConfig(value);
    const operation = this.queue.then(async () => {
      await this.ready;
      await this.store?.save(next);
      this.active.abort();
      this.active = new AbortController();
      this.config = next;
      this.loadError = null;
      return { ...next };
    });
    this.queue = operation.catch(() => {
    });
    return operation;
  }
  dispose() {
    this.active.abort();
  }
  async request(path, options, configuration, consume = (response) => response) {
    const config = configuration ? validateQwenConfig(configuration) : await this.getConfig();
    const timeout = AbortSignal.timeout(config.timeoutMs);
    const signal = AbortSignal.any([
      timeout,
      this.active.signal,
      ...options.signal ? [options.signal] : []
    ]);
    const response = await this.fetch(new URL(path, config.baseUrl), {
      ...options,
      signal,
      redirect: "error"
    });
    const value = await consume(response);
    signal.throwIfAborted();
    return value;
  }
  async serverInfo(signal, configuration) {
    const response = await this.request("health", { signal }, configuration, async (response2) => ({
      ok: response2.ok,
      status: response2.status,
      body: response2.ok ? await response2.json() : null
    }));
    return { ...response, ominix: response.body?.service === "ominix-api" };
  }
  async capability(signal, configuration, kind = "both") {
    try {
      const config = configuration ? validateQwenConfig(configuration) : await this.getConfig();
      const health = await this.serverInfo(signal, config);
      let models = health.body?.models;
      if (health.ominix && health.ok) {
        const status = await this.request(
          "v1/models/status",
          { signal },
          config,
          async (response) => ({
            ok: response.ok,
            status: response.status,
            body: response.ok ? await response.json() : null
          })
        );
        models = {
          asr: status.body?.models?.asr === "qwen3-asr",
          tts: status.body?.models?.qwen3_tts === "customvoice"
        };
      }
      const ready = kind === "asr" ? models?.asr === true : kind === "tts" ? models?.tts === true : models?.asr === true && models?.tts === true;
      return health.ok && ready ? { supported: true, local: true, location: "host", streaming: false, models } : {
        supported: false,
        local: true,
        location: "host",
        streaming: false,
        reason: `Qwen health check did not report ${kind === "both" ? "both ASR and TTS" : kind.toUpperCase()} ready (${health.status}).`
      };
    } catch (error) {
      return {
        supported: false,
        local: true,
        location: "host",
        streaming: false,
        reason: "Qwen speech server is unreachable: " + (error?.message || error)
      };
    }
  }
  async transcribe(input, { lang = "pt-BR", signal } = {}) {
    const bytes = validateMonoPcm16Wav(input, { maxBytes: this.maxBytes }), resolved = language(lang), health = await this.serverInfo(signal);
    let body, headers;
    if (health.ominix) {
      headers = { "content-type": "application/json" };
      body = JSON.stringify({
        file: Buffer.from(bytes).toString("base64"),
        language: resolved,
        response_format: "json"
      });
    } else {
      const form = new FormData();
      form.append("file", new Blob([bytes], { type: "audio/wav" }), "utterance.wav");
      form.append("response_format", "json");
      if (resolved) form.append("language", resolved);
      body = form;
    }
    return this.request(
      "v1/audio/transcriptions",
      { method: "POST", headers, body, signal },
      void 0,
      async (response) => {
        if (!response.ok) throw new Error("Qwen transcription failed (" + response.status + ").");
        const json = await response.json();
        return { text: clean2(json?.text) };
      }
    );
  }
  async synthesize(text, { lang = "pt-BR", signal, voice = defaultQwenVoice } = {}) {
    if (typeof text !== "string" || !text.trim() || text.length > 1e5 || text.includes("\0"))
      throw new Error("Speech text must contain 1\u2013100000 characters without NUL.");
    if (!isQwenVoice(voice)) throw new Error("Unsupported Qwen voice.");
    return this.request(
      "v1/audio/speech",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: "qwen3-tts",
          input: text,
          voice,
          language: language(lang) || "portuguese",
          response_format: "wav"
        }),
        signal
      },
      void 0,
      async (response) => {
        if (!response.ok) throw new Error("Qwen synthesis failed (" + response.status + ").");
        const length = Number(response.headers.get("content-length") || 0);
        if (length > this.maxSpeechBytes) throw new Error("Qwen speech response is too large.");
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength < 44 || bytes.byteLength > this.maxSpeechBytes)
          throw new Error("Qwen returned invalid or oversized speech audio.");
        return bytes;
      }
    );
  }
};

// src/server.ts
var name = "dsh-live-voice";
var inject = ["connection"];
var SAY_CHANNEL = "/api/dsh-live-voice";
var ok = (value) => ({ ok: true, value });
var fail = (code, message) => ({ ok: false, error: { code, message, details: {} } });
var identity = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
function createSayHost({ engine = new SayEngine() } = {}) {
  let active = null;
  let disposed = false;
  async function handle(endpoint, payload, signal) {
    if (disposed) return fail("disposed", "Speech service is closed.");
    if (signal?.aborted) return fail("cancelled", "Speech was cancelled.");
    try {
      if (endpoint === "capabilities") return ok(await engine.getCapabilities());
      if (!["speak", "stop", "pause", "resume"].includes(endpoint))
        return fail("not-found", "Unknown speech endpoint.");
      if (!payload || !identity(payload.clientId) || !identity(payload.operationId)) {
        return fail("invalid-request", "Valid client and operation IDs are required.");
      }
      const owns = active?.clientId === payload.clientId && active?.operationId === payload.operationId;
      if (endpoint !== "speak") {
        if (!owns) return ok({ applied: false });
        const operation2 = active;
        if (endpoint === "stop") {
          operation2.abort.abort();
          await operation2.done;
          return ok({ applied: true });
        }
        return ok({ applied: Boolean(engine[endpoint]()) });
      }
      if (typeof payload.text !== "string" || !payload.text.trim() || payload.text.length > 1e5 || payload.text.includes("\0"))
        return fail("invalid-request", "Speech text must contain 1\u2013100000 characters without NUL.");
      if (payload.voice !== void 0 && (typeof payload.voice !== "string" || !payload.voice.trim() || payload.voice.length > 200 || payload.voice.includes("\0")))
        return fail("invalid-request", "Invalid voice.");
      if (!Number.isFinite(payload.rate) || payload.rate < 18 || payload.rate > 1750)
        return fail("invalid-request", "Invalid speech rate.");
      if (active && active.clientId !== payload.clientId)
        return fail("busy", "Another voice client owns the host speaker.");
      if (owns) return fail("duplicate-operation", "The speech operation is already active.");
      active?.abort.abort();
      const operation = {
        clientId: payload.clientId,
        operationId: payload.operationId,
        abort: new AbortController(),
        done: null
      };
      active = operation;
      const cancel = () => operation.abort.abort();
      signal?.addEventListener("abort", cancel, { once: true });
      if (signal?.aborted) cancel();
      operation.done = Promise.resolve().then(
        () => engine.speak(payload.text, {
          voice: payload.voice,
          rate: payload.rate,
          signal: operation.abort.signal
        })
      ).then(
        () => ok({ completed: true }),
        (error) => error?.name === "AbortError" ? fail("cancelled", "Speech was cancelled.") : fail("speech-failed", "Local speech failed.")
      );
      try {
        return await operation.done;
      } finally {
        signal?.removeEventListener("abort", cancel);
        if (active === operation) active = null;
      }
    } catch {
      return fail("speech-failed", "Local speech service failed.");
    }
  }
  async function dispose() {
    disposed = true;
    active?.abort.abort();
    await engine.stop();
    active = null;
  }
  return { handle, dispose };
}
function apply(ctx, {
  whisperStore = createWhisperConfigStore(),
  whisperFetch = globalThis.fetch,
  qwenStore = createQwenConfigStore(),
  qwenFetch = globalThis.fetch
} = {}) {
  const host = createSayHost();
  const whisper = new WhisperHttpHost({ store: whisperStore, fetchImpl: whisperFetch });
  const qwen = new QwenHttpHost({ store: qwenStore, fetchImpl: qwenFetch });
  for (const endpoint of ["config", "test"]) {
    const dispose = ctx.connection.fetch.register({
      path: SAY_CHANNEL + "/whisper/" + endpoint,
      methods: endpoint === "config" ? ["GET", "PUT"] : ["POST"],
      requestBody: "buffered",
      fetch: async (request) => {
        try {
          if (request.method === "GET") return Response.json(ok(await whisper.getConfig()));
          let config;
          try {
            config = validateWhisperConfig(await request.json());
          } catch (error) {
            return Response.json(fail("invalid-config", error.message), { status: 400 });
          }
          const value = endpoint === "test" ? await whisper.capability(request.signal, config) : await whisper.replaceConfig(config);
          return Response.json(ok(value));
        } catch (error) {
          return Response.json(
            fail("config-failed", error.message || "Whisper settings could not be saved."),
            { status: 500 }
          );
        }
      }
    });
    ctx.effect(() => () => dispose(), "dsh-live-voice: remove Whisper " + endpoint + " route");
  }
  ctx.effect(() => () => whisper.dispose(), "dsh-live-voice: cancel Whisper requests");
  const whisperCapability = ctx.connection.fetch.register({
    path: SAY_CHANNEL + "/whisper/capabilities",
    methods: ["GET"],
    requestBody: "buffered",
    fetch: async (request) => Response.json(ok(await whisper.capability(request.signal)))
  });
  const whisperTranscribe = ctx.connection.fetch.register({
    path: SAY_CHANNEL + "/whisper/transcribe",
    methods: ["POST"],
    requestBody: "buffered",
    fetch: async (request) => {
      try {
        const clientId = request.headers.get("x-dlv-client-id"), operationId = request.headers.get("x-dlv-operation-id");
        if (!identity(clientId) || !identity(operationId))
          return Response.json(
            fail("invalid-request", "Valid client and operation IDs are required."),
            { status: 400 }
          );
        if (request.headers.get("content-type")?.split(";")[0] !== "audio/wav")
          return Response.json(
            fail("invalid-audio", "A mono 16 kHz PCM WAV recording is required."),
            { status: 400 }
          );
        const length = Number(request.headers.get("content-length") || 0);
        if (length > whisper.maxBytes)
          return Response.json(
            fail("audio-too-large", "The recording exceeds the configured Whisper limit."),
            { status: 413 }
          );
        const value = await whisper.transcribe(await request.arrayBuffer(), {
          lang: request.headers.get("x-dlv-language") || "auto",
          signal: request.signal
        });
        return Response.json(ok(value));
      } catch (error) {
        if (error?.name === "AbortError")
          return Response.json(fail("cancelled", "Whisper transcription was cancelled."), {
            status: 499
          });
        return Response.json(
          fail("transcription-failed", error?.message || "Whisper transcription failed."),
          { status: 502 }
        );
      }
    }
  });
  ctx.effect(
    () => async () => {
      await whisperCapability();
      await whisperTranscribe();
    },
    "dsh-live-voice: remove Whisper routes"
  );
  for (const endpoint of ["config", "test"]) {
    const dispose = ctx.connection.fetch.register({
      path: SAY_CHANNEL + "/qwen/" + endpoint,
      methods: endpoint === "config" ? ["GET", "PUT"] : ["POST"],
      requestBody: "buffered",
      fetch: async (request) => {
        try {
          if (request.method === "GET") return Response.json(ok(await qwen.getConfig()));
          let config;
          try {
            config = validateQwenConfig(await request.json());
          } catch (error) {
            return Response.json(fail("invalid-config", error.message), { status: 400 });
          }
          const value = endpoint === "test" ? await qwen.capability(request.signal, config) : await qwen.replaceConfig(config);
          return Response.json(ok(value));
        } catch (error) {
          return Response.json(
            fail("config-failed", error.message || "Qwen settings could not be saved."),
            { status: 500 }
          );
        }
      }
    });
    ctx.effect(() => () => dispose(), "dsh-live-voice: remove Qwen " + endpoint + " route");
  }
  ctx.effect(() => () => qwen.dispose(), "dsh-live-voice: cancel Qwen requests");
  const qwenCapability = ctx.connection.fetch.register({
    path: SAY_CHANNEL + "/qwen/capabilities",
    methods: ["GET"],
    requestBody: "buffered",
    fetch: async (request) => {
      const kind = new URL(request.url).searchParams.get("kind");
      return Response.json(
        ok(
          await qwen.capability(
            request.signal,
            void 0,
            kind === "asr" || kind === "tts" ? kind : "both"
          )
        )
      );
    }
  });
  const qwenTranscribe = ctx.connection.fetch.register({
    path: SAY_CHANNEL + "/qwen/transcribe",
    methods: ["POST"],
    requestBody: "buffered",
    fetch: async (request) => {
      try {
        const clientId = request.headers.get("x-dlv-client-id"), operationId = request.headers.get("x-dlv-operation-id");
        if (!identity(clientId) || !identity(operationId))
          return Response.json(
            fail("invalid-request", "Valid client and operation IDs are required."),
            { status: 400 }
          );
        if (request.headers.get("content-type")?.split(";")[0] !== "audio/wav")
          return Response.json(
            fail("invalid-audio", "A mono 16 kHz PCM WAV recording is required."),
            { status: 400 }
          );
        const length = Number(request.headers.get("content-length") || 0);
        if (length > qwen.maxBytes)
          return Response.json(
            fail("audio-too-large", "The recording exceeds the configured Qwen limit."),
            { status: 413 }
          );
        return Response.json(
          ok(
            await qwen.transcribe(await request.arrayBuffer(), {
              lang: request.headers.get("x-dlv-language") || "pt-BR",
              signal: request.signal
            })
          )
        );
      } catch (error) {
        if (error?.name === "AbortError")
          return Response.json(fail("cancelled", "Qwen transcription was cancelled."), {
            status: 499
          });
        return Response.json(
          fail("transcription-failed", error?.message || "Qwen transcription failed."),
          { status: 502 }
        );
      }
    }
  });
  const qwenSpeech = ctx.connection.fetch.register({
    path: SAY_CHANNEL + "/qwen/speech",
    methods: ["POST"],
    requestBody: "buffered",
    fetch: async (request) => {
      try {
        const body = await request.json();
        const bytes = await qwen.synthesize(body?.text, {
          lang: body?.lang || "pt-BR",
          voice: body?.voice,
          signal: request.signal
        });
        return new Response(bytes, {
          status: 200,
          headers: { "content-type": "audio/wav", "cache-control": "no-store" }
        });
      } catch (error) {
        if (error?.name === "AbortError")
          return Response.json(fail("cancelled", "Qwen synthesis was cancelled."), { status: 499 });
        return Response.json(fail("synthesis-failed", error?.message || "Qwen synthesis failed."), {
          status: 502
        });
      }
    }
  });
  ctx.effect(
    () => async () => {
      await qwenCapability();
      await qwenTranscribe();
      await qwenSpeech();
    },
    "dsh-live-voice: remove Qwen routes"
  );
  for (const endpoint of ["capabilities", "speak", "stop", "pause", "resume"]) {
    const dispose = ctx.connection.fetch.register({
      path: `${SAY_CHANNEL}/${endpoint}`,
      methods: ["POST"],
      requestBody: "buffered",
      fetch: async (request) => {
        let body;
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (body?.type !== "client-request" || typeof body.rpcId !== "string" || body.rpcId.length > 128 || body.method !== `dsh-live-voice/${endpoint}`)
          return new Response("Invalid RPC envelope", { status: 400 });
        const result = await host.handle(endpoint, body.payload, request.signal);
        return Response.json({ type: "server-response", rpcId: body.rpcId, result });
      }
    });
    ctx.effect(() => () => dispose(), `dsh-live-voice: remove ${endpoint} route`);
  }
  ctx.effect(() => () => host.dispose(), "dsh-live-voice: stop host speech");
}
export {
  SAY_CHANNEL,
  apply,
  createSayHost,
  inject,
  name
};
