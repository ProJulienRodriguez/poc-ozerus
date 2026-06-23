import { TemplateStatusEnum } from '../value-objects/template-status.value-object';

export class TemplateMustBeDraftToPublishRule {
  readonly message = 'Seul un template en DRAFT peut être publié';

  constructor(private readonly currentStatus: TemplateStatusEnum) {}

  isBroken(): boolean {
    return this.currentStatus !== TemplateStatusEnum.DRAFT;
  }
}
