export class PreviewTemplateQuery {
  constructor(
    public readonly name: string,
    public readonly version: number,
    public readonly locale: string,
  ) {}
}

export interface PreviewTemplateResult {
  subject: string;
  html: string;
}
