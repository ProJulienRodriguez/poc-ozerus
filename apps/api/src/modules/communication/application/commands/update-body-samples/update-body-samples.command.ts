export class UpdateBodySamplesCommand {
  constructor(
    public readonly versionId: string,
    public readonly locale: string,
    public readonly samples: Record<string, string>,
  ) {}
}
