// @ts-nocheck
/** Validate the overload without ever granting the probe microphone access.
 * Optional Web IDL arguments do not change start.length; legacy implementations
 * may silently ignore a track. Only an invalid, synthetic track is passed here.
 */
export async function detectExternalAudioSupport(globals = globalThis, { signal } = {}) {
  let frame, stream, recognition, timer, onAbort;
  const clearTimer = globals.clearTimeout ?? globalThis.clearTimeout;
  try {
    if (signal?.aborted) return false;
    const document = globals.document;
    if (!document?.body) return false;
    frame = document.createElement('iframe');
    frame.hidden = true;
    frame.allow = "microphone 'none'";
    frame.srcdoc = '<!doctype html><html></html>';
    const loaded = await new Promise((resolve) => {
      frame.onload = () => resolve(true);
      frame.onerror = () => resolve(false);
      onAbort = () => resolve(false);
      signal?.addEventListener('abort', onAbort, { once: true });
      timer = (globals.setTimeout ?? globalThis.setTimeout)(() => resolve(false), 3000);
      document.body.append(frame);
    });
    if (!loaded || signal?.aborted || !frame.isConnected) return false;
    const doc = frame.contentDocument;
    const window = frame.contentWindow;
    const policy = doc?.permissionsPolicy ?? doc?.featurePolicy;
    // Unknown policy features can also report false: require a known feature.
    if (
      !policy?.features?.().includes('microphone') ||
      policy.allowsFeature('microphone') !== false
    )
      return false;
    const Recognition =
      typeof globals.SpeechRecognition === 'function'
        ? window?.SpeechRecognition
        : window?.webkitSpeechRecognition;
    if (typeof Recognition !== 'function') return false;
    stream = doc.createElement('canvas').captureStream();
    const track = stream.getVideoTracks()[0];
    if (!track || track.kind !== 'video') return false;
    track.stop();
    if (track.readyState !== 'ended') return false;
    recognition = new Recognition();
    if (typeof recognition.start !== 'function' || typeof recognition.abort !== 'function')
      return false;
    // This constructor belongs to the policy-denied, attached frame, not the host.
    // Fresh instances cannot be "already started"; track validation must throw.
    try {
      recognition.start(track);
      return false;
    } catch (error) {
      return error?.name === 'InvalidStateError' && frame.isConnected && !signal?.aborted;
    } finally {
      recognition.abort();
    }
  } catch {
    // CSP, unavailable policy inspection, canvas capture, and DOM failures fail closed.
    return false;
  } finally {
    if (timer !== undefined) clearTimer(timer);
    signal?.removeEventListener('abort', onAbort);
    if (frame) {
      frame.onload = null;
      frame.onerror = null;
    }
    for (const track of stream?.getTracks() ?? []) track.stop();
    frame?.remove();
  }
}
