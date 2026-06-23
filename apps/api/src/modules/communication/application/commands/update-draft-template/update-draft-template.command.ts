export class UpdateDraftTemplateCommand {
  constructor(
    public readonly versionId: string,
    public readonly locale: string,
    public readonly subject: string,
    public readonly bodyMjml: string,
    public readonly variables: string[],
    public readonly bodyState?: Record<string, unknown> | null,
  ) {}
}
