// @ts-nocheck
import { MeetingTranscript } from './meetingTranscript.js';

/** Independent source lifecycles; no submit or voice-command path is exposed. */
export class MeetingController {
  constructor({ composer, settings, createSource, translate }) {
    this.settings = settings;
    this.createSource = createSource;
    this.t = translate;
    this.transcript = new MeetingTranscript(composer);
    this.jobs = new Map();
    this.generations = new Map();
    this.listeners = new Set();
    this.snapshot = {
      active: false,
      timestamps: false,
      microphone: { starting: false, listening: false, pending: 0, error: null },
      shared: { starting: false, listening: false, pending: 0, error: null },
    };
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  patch(source, next) {
    this.snapshot = {
      ...this.snapshot,
      ...(source ? { [source]: { ...this.snapshot[source], ...next } } : next),
    };
    for (const listener of this.listeners) listener();
  }
  toggleTimestamps() {
    const enabled = !this.snapshot.timestamps;
    this.transcript.setTimestamps(enabled);
    this.patch(null, { timestamps: enabled });
  }
  async start(source, request) {
    if (this.disposed) {
      request
        ?.then((stream) => stream.getTracks().forEach((track) => track.stop()))
        .catch(() => {});
      return;
    }
    const stopping = this.stop(source);
    const generation = this.generations.get(source);
    await stopping;
    if (this.disposed || this.generations.get(source) !== generation) {
      request
        ?.then((stream) => stream.getTracks().forEach((track) => track.stop()))
        .catch(() => {});
      return;
    }
    this.patch(null, { active: true });
    const abort = new AbortController();
    const job = { abort };
    this.jobs.set(source, job);
    const valid = () => this.jobs.get(source) === job && !abort.signal.aborted;
    this.patch(source, { starting: true, error: null });
    try {
      const settings = this.settings();
      if (settings.recognitionEngine === 'browser') throw new Error(this.t('httpRequired'));
      const { meter, engine } = this.createSource(source, settings);
      Object.assign(job, { meter, engine });
      if (source === 'shared') meter.provide(request);
      meter.deviceId = settings.inputDeviceId;
      const capability = await engine.capability();
      if (!valid()) return;
      if (!capability.supported) throw new Error(capability.reason || this.t('unavailable'));
      if (!(await meter.start({ signal: abort.signal })) || !valid()) return;
      this.transcript.setActive(source, true);
      for (const track of meter.stream?.getTracks() || [])
        track.addEventListener(
          'ended',
          () => {
            if (valid()) void this.stop(source);
          },
          { once: true },
        );
      await engine.start({
        lang: settings.recognitionLang,
        signal: abort.signal,
        onResult: ({ final, startedAt }) => {
          if (valid() && final) this.transcript.append(source, final, startedAt);
        },
        onProcessingChange: ({ pending }) => {
          if (valid()) this.patch(source, { pending });
        },
        onError: (error) => {
          if (valid()) {
            this.patch(source, { error: this.t('failed') });
            void this.stop(source);
          }
        },
      });
      if (valid()) this.patch(source, { starting: false, listening: true });
    } catch (error) {
      if (valid()) {
        this.patch(source, {
          error:
            source === 'shared' && error.message === 'No shared audio track was returned.'
              ? this.t('noAudio')
              : error.message === this.t('httpRequired')
                ? error.message
                : this.t('failed'),
        });
        await this.stop(source);
      }
    } finally {
      if (!valid()) {
        await job.engine?.stop();
        await job.meter?.stop();
      }
      if (source === 'shared' && !job.meter?.stream)
        request
          ?.then((stream) => stream.getTracks().forEach((track) => track.stop()))
          .catch(() => {});
    }
  }
  async stop(source) {
    this.generations.set(source, (this.generations.get(source) || 0) + 1);
    const job = this.jobs.get(source);
    this.jobs.delete(source);
    job?.abort.abort();
    this.transcript.setActive(source, false);
    this.patch(source, { starting: false, listening: false, pending: 0 });
    await job?.engine?.stop();
    await job?.meter?.stop();
  }
  async end() {
    await Promise.all(['microphone', 'shared'].map((source) => this.stop(source)));
    this.transcript.reset();
    this.patch(null, { active: false });
  }
  async dispose() {
    this.disposed = true;
    await this.end();
    this.listeners.clear();
  }
}
