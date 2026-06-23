import { ValueObject } from './value-object.base';

const SUBJECT_MAX_LENGTH = 998;

export class TemplateSubject extends ValueObject<{ value: string }> {
  get value(): string {
    return this.props.value;
  }

  protected validate(): void {
    const raw = this.props.value;
    if (!raw || raw.trim().length === 0) {
      throw new Error('Le sujet du template ne peut pas être vide');
    }
    if (raw.length > SUBJECT_MAX_LENGTH) {
      throw new Error(`Sujet du template trop long (> ${SUBJECT_MAX_LENGTH} caractères)`);
    }
  }
}
