import { TemplateStatusEnum } from '../value-objects/template-status.value-object';

export class TemplateMustBeDraftToUpdateRule {
  readonly message = 'Seul un template en DRAFT peut être modifié';

  constructor(private readonly currentStatus: TemplateStatusEnum) {}

  isBroken(): boolean {
    return this.currentStatus !== TemplateStatusEnum.DRAFT;
  }
}
