export interface TemplateBodyInput {
  locale: string;
  subject: string;
  bodyMjml: string;
  variables: string[];
  bodyState?: Record<string, unknown> | null;
}

export class CreateDraftTemplateCommand {
  constructor(
    public readonly name: string,
    public readonly bodies: TemplateBodyInput[],
  ) {}
}
