/** Runs async jobs one at a time, in order. A failed job does not block later ones. */
export class SerialQueue {
  private tail: Promise<unknown> = Promise.resolve();

  run<T>(job: () => Promise<T>): Promise<T> {
    const next = this.tail.catch(() => undefined).then(job);
    this.tail = next;
    return next;
  }
}
