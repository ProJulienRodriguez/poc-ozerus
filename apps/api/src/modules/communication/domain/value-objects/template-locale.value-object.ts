import { ValueObject } from './value-object.base';

const LOCALE_REGEX = /^[a-z]{2}(-[A-Z]{2})?$/;

export class TemplateLocale extends ValueObject<{ value: string }> {
  get value(): string {
    return this.props.value;
  }

  protected validate(): void {
    const raw = this.props.value;
    if (!raw || !LOCALE_REGEX.test(raw)) {
      throw new Error(`Locale invalide : "${raw}" (attendu: "fr", "en", "fr-CA"…)`);
    }
  }
}
