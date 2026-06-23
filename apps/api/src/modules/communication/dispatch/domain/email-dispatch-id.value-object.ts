import { randomUUID } from 'crypto';

export class EmailDispatchId {
  private constructor(public readonly value: string) {}

  static create(value: string): EmailDispatchId {
    return new EmailDispatchId(value);
  }

  static createNew(): EmailDispatchId {
    return new EmailDispatchId(randomUUID());
  }
}
