export class GetPublishedTemplateQuery {
  constructor(
    public readonly name: string,
    public readonly locale: string,
  ) {}
}
