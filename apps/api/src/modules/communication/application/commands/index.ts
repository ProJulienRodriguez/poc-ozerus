import { AddLocaleHandler } from './add-locale/add-locale.handler';
import { ArchiveTemplateHandler } from './archive-template/archive-template.handler';
import { CreateDraftTemplateHandler } from './create-draft-template/create-draft-template.handler';
import { PublishTemplateHandler } from './publish-template/publish-template.handler';
import { UpdateBodySamplesHandler } from './update-body-samples/update-body-samples.handler';
import { UpdateDraftTemplateHandler } from './update-draft-template/update-draft-template.handler';

export const CommandHandlers = [
  CreateDraftTemplateHandler,
  UpdateDraftTemplateHandler,
  UpdateBodySamplesHandler,
  AddLocaleHandler,
  PublishTemplateHandler,
  ArchiveTemplateHandler,
];
