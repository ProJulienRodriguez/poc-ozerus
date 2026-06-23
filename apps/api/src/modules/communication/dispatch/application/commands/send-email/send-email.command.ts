export class SendEmailCommand {
  constructor(
    public readonly templateName: string,
    public readonly to: string,
    public readonly locale: string,
    public readonly variables: Record<string, string | number | boolean>,
    public readonly templateVersion?: number,
  ) {}
}

export interface SendEmailResult {
  messageId: string;
  sentAt: string;
}
