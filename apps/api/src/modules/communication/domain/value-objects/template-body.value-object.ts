import { ValueObject } from './value-object.base';

export interface TemplateBodyProps {
  mjml: string;
  state: Record<string, unknown> | null;
}

export class TemplateBody extends ValueObject<TemplateBodyProps> {
  get mjml(): string {
    return this.props.mjml;
  }

  get state(): Record<string, unknown> | null {
    return this.props.state;
  }

  protected validate(): void {
    if (!this.props.mjml || this.props.mjml.trim().length === 0) {
      throw new Error('Le corps MJML du template ne peut pas être vide');
    }
  }
}
