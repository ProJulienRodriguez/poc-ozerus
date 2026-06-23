import { ValueObject } from './value-object.base';

const VARIABLE_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export class TemplateVariables extends ValueObject<{ values: string[] }> {
  get values(): string[] {
    return [...this.props.values];
  }

  has(name: string): boolean {
    return this.props.values.includes(name);
  }

  protected validate(): void {
    const values = this.props.values;
    if (!Array.isArray(values)) {
      throw new Error('Les variables du template doivent être un tableau');
    }
    const seen = new Set<string>();
    for (const variable of values) {
      if (!VARIABLE_REGEX.test(variable)) {
        throw new Error(
          `Nom de variable invalide : "${variable}" (attendu: identifiant JS valide)`,
        );
      }
      if (seen.has(variable)) {
        throw new Error(`Variable déclarée deux fois : "${variable}"`);
      }
      seen.add(variable);
    }
  }
}
