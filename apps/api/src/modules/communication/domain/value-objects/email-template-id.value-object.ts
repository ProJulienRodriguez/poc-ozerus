import { randomUUID } from 'crypto';

export class EmailTemplateId {
  private constructor(public readonly value: string) {}

  static create(value: string): EmailTemplateId {
    return new EmailTemplateId(value);
  }

  static createNew(): EmailTemplateId {
    return new EmailTemplateId(randomUUID());
  }
}
