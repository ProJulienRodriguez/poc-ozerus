import { ValueObject } from './value-object.base';

export enum TemplateStatusEnum {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

const VALID_STATUSES = new Set(Object.values(TemplateStatusEnum));

export class TemplateStatus extends ValueObject<{ value: TemplateStatusEnum }> {
  get value(): TemplateStatusEnum {
    return this.props.value;
  }

  is(status: TemplateStatusEnum): boolean {
    return this.props.value === status;
  }

  isDraft(): boolean {
    return this.is(TemplateStatusEnum.DRAFT);
  }

  isPublished(): boolean {
    return this.is(TemplateStatusEnum.PUBLISHED);
  }

  isArchived(): boolean {
    return this.is(TemplateStatusEnum.ARCHIVED);
  }

  static draft(): TemplateStatus {
    return new TemplateStatus({ value: TemplateStatusEnum.DRAFT });
  }

  static published(): TemplateStatus {
    return new TemplateStatus({ value: TemplateStatusEnum.PUBLISHED });
  }

  static archived(): TemplateStatus {
    return new TemplateStatus({ value: TemplateStatusEnum.ARCHIVED });
  }

  static fromString(value: string): TemplateStatus {
    if (!VALID_STATUSES.has(value as TemplateStatusEnum)) {
      throw new Error(`Statut de template invalide : "${value}"`);
    }
    return new TemplateStatus({ value: value as TemplateStatusEnum });
  }

  protected validate(): void {
    if (!VALID_STATUSES.has(this.props.value)) {
      throw new Error(`Statut de template invalide : "${this.props.value}"`);
    }
  }
}
