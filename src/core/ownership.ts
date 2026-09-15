// @ts-nocheck
/** Serialize hardware handoffs without holding the lock for speech duration. */
export class VoiceOwnership {
  constructor() {
    this.epoch = 0;
    this.tail = Promise.resolve();
    this.closed = false;
  }
  run(owner, owners, action) {
    const epoch = ++this.epoch;
    let outcome;
    const acquired = this.tail.then(async () => {
      if (this.closed || epoch !== this.epoch || owner.disposed) return;
      await Promise.all(
        owners.filter((other) => other !== owner).map((other) => other.endConversation()),
      );
      if (this.closed || epoch !== this.epoch || owner.disposed) return;
      outcome = Promise.resolve(action());
      outcome.catch(() => {});
    });
    this.tail = acquired.catch(() => {});
    return acquired.then(() => outcome);
  }
  cancel() {
    ++this.epoch;
  }
  close() {
    this.closed = true;
    this.cancel();
  }
}
