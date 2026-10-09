// @ts-nocheck
import { MeetingTranscript } from './meetingTranscript.js';
import { VoiceCoordinator } from '../../core/coordinator.ts';

/** Application-owned capture; each source uses the same independent input policy. */
export class MeetingController {
  constructor({ composer, settings, createSource, translate, onActivity, onSpeech, stopSpeech }) {
    this.composer = composer;
    this.stopSpeech = stopSpeech;
    this.inputs = new Map();
    this.inputOverrides = new Map();
    this.settings = settings;
    this.createSource = createSource;
    this.t = translate;
    this.onActivity = onActivity;
    this.onSpeech = onSpeech;
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
    if (source) {
      const input = this.inputs.get(source) || (next.listening || next.starting || next.error ? this.input(source) : null);
      const policy = {};
      for (const key of ['starting', 'listening', 'error'])
        if (Object.hasOwn(next, key)) policy[key] = next[key];
      if (Object.hasOwn(next, 'pending')) policy.pendingTranscriptions = next.pending;
      input?.patch(policy);
    }
    this.snapshot = {
      ...this.snapshot,
      ...(source ? { [source]: { ...this.snapshot[source], ...next } } : next),
    };
    for (const listener of this.listeners) listener();
  }
  input(source = 'shared') {
    if (this.inputs.has(source)) return this.inputs.get(source);
    // Capture remains application-owned. This coordinator owns only source policy;
    // it never acquires the microphone or queues a second assistant playback.
    const input = new VoiceCoordinator({
      recognition: { stop: async () => {} }, engines: {},
      meter: { stop: async () => {} }, settings: { ...this.settings(), microphoneEnabled: true },
      composer: {
        getDraft: () => this.composer.getDraft(),
        setDraft: (text) => this.composer.setDraft(text),
        appendFinal: (text, startedAt) => {
          this.transcript.append(source, text, startedAt);
          return this.composer.getDraft();
        },
        submit: (mode) => this.composer.submit?.(mode),
        handleQuestionResult: (result) => this.composer.handleQuestionResult?.(result),
        canAutoSend: () => this.composer.canAutoSend?.() !== false,
      },
    });
    this.inputOverrides.set(source, {
      sendingMode: input.getSnapshot().settings.sendingMode,
      voiceCommandsEnabled: input.getSnapshot().settings.voiceCommandsEnabled,
    });
    const update = input.updateSettings.bind(input);
    input.updateSettings = (next) => {
      this.inputOverrides.set(source, { ...this.inputOverrides.get(source), ...next });
      update(next);
    };
    input.clearError = () => this.patch(source, { error: null });
    input.endConversation = () => this.stop(source);
    input.stopSpeech = () => this.stopSpeech?.();
    const updatePolicy = input.updateSettings;
    input.updateSettings = (next) => {
      if (Object.hasOwn(next, 'announceAssistantMessages'))
        this.composer.updatePlaybackSettings?.({ announceAssistantMessages: next.announceAssistantMessages });
      return updatePolicy(next);
    };
    input.toggleTimestamps = () => {
      const timestamps = !input.getSnapshot().timestamps;
      this.transcript.setSourceTimestamps(source, timestamps);
      input.patch({ timestamps });
    };
    this.inputs.set(source, input);
    return input;
  }
  applySettings(settings) {
    for (const [source, input] of this.inputs)
      VoiceCoordinator.prototype.updateSettings.call(input, {
        ...settings, ...this.inputOverrides.get(source),
        microphoneEnabled: !input.getSnapshot().muted,
      });
  }
  composerChanged(draft) {
    for (const input of this.inputs.values()) input.composerChanged(draft);
  }
  refreshDeliveryReadiness() {
    for (const input of this.inputs.values()) input.refreshDeliveryReadiness();
  }
  cancelDelivery() {
    for (const input of this.inputs.values()) input.cancelAutoSend();
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
    this.input(source);
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
      const input = this.input(source);
      input.meter = meter;
      input.updateSettings({ microphoneEnabled: true });
      this.applySettings(settings);
      input.patch({ conversation: true, starting: true, error: null });
      Object.assign(job, { meter, engine });
      if (source === 'shared') meter.provide(request);
      meter.deviceId = settings.inputDeviceId;
      const capability = await engine.capability();
      if (!valid()) return;
      if (!capability.supported) throw new Error(capability.reason || this.t('unavailable'));
      if (!(await meter.start({ signal: abort.signal }))) {
        if (valid()) await this.stop(source);
        return;
      }
      if (!valid()) return;
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
        onResult: ({ final, interim, startedAt }) => {
          if (!valid()) return;
          const accepted = this.onSpeech?.(source, final || interim) !== false;
          if (accepted) input.onResult({ final, interim, startedAt });
          else if (final) input.patch({ recognizing: false });
          if (final && !interim) {
            this.onActivity?.(source, false);
            input.refreshDeliveryReadiness();
          }
        },
        onActivity: (active) => {
          if (!valid()) return;
          if (active) input.cancelAutoSend({ preserveIntent: true });
          input.patch({ recognizing: active });
          this.onActivity?.(source, active);
          input.refreshDeliveryReadiness();
        },
        onProcessingChange: ({ pending }) => {
          if (!valid()) return;
          input.patch({ pendingTranscriptions: pending });
          this.patch(source, { pending });
          if (pending) input.cancelAutoSend({ preserveIntent: true });
          else if (!input.getSnapshot().muted) input.maybeScheduleAutoSend();
        },
        onError: (error) => {
          if (valid()) {
            this.patch(source, { error: this.t('failed') });
            void this.stop(source);
          }
        },
      });
      if (valid()) {
        input.patch({ starting: false, listening: true });
        this.patch(source, { starting: false, listening: true });
      }
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
    const input = this.inputs.get(source);
    input?.cancelAutoSend();
    input?.patch({ conversation: false, starting: false, listening: false, recognizing: false, pendingTranscriptions: 0 });
    this.onActivity?.(source, false);
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
    for (const input of this.inputs.values()) {
      input.cancelAutoSend();
      input.disposed = true;
      input.listeners.clear();
    }
    this.listeners.clear();
  }
}
