/** An integration event that doesn't match the published language: retrying can't fix it. */
export class InvalidIntegrationEvent extends Error {
  constructor(topic: string, reason: string) {
    super(`Invalid ${topic}: ${reason}`);
    this.name = 'InvalidIntegrationEvent';
  }
}
