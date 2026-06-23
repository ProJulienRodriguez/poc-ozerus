/** Aperçu sans persistance : compile un MJML + sujet arbitraires avec des valeurs d'exemple. */
export class PreviewDraftQuery {
  constructor(
    public readonly subject: string,
    public readonly bodyMjml: string,
    public readonly variables: Record<string, string | number | boolean>,
    public readonly engineVersion = 1,
  ) {}
}
