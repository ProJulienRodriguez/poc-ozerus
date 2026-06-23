import { ValueObject } from './value-object.base';

const NAME_REGEX = /^[a-z0-9_]+$/;
const NAME_MAX_LENGTH = 64;

export class TemplateName extends ValueObject<{ value: string }> {
  get value(): string {
    return this.props.value;
  }

  protected validate(): void {
    const raw = this.props.value;
    if (!raw || raw.length > NAME_MAX_LENGTH || !NAME_REGEX.test(raw)) {
      throw new Error(
        `Nom de template invalide : "${raw}" (attendu: snake_case, <= ${NAME_MAX_LENGTH} caractères)`,
      );
    }
  }
}
