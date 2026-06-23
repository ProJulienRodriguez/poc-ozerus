import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { IdentityModule } from '../identity/identity.module';
import { CommandHandlers } from './application/commands';
import { MJML_COMPILER_PORT } from './application/ports/mjml-compiler.port';
import { TEMPLATE_ENGINE_PORT } from './application/ports/template-engine.port';
import { EMAIL_TEMPLATE_QUERY_REPOSITORY } from './application/queries/email-template.query-repository';
import { GetPublishedTemplateHandler } from './application/queries/get-published-template/get-published-template.handler';
import { GetTemplateByIdHandler } from './application/queries/get-template-by-id/get-template-by-id.handler';
import { ListTemplateTypesHandler } from './application/queries/list-template-types/list-template-types.handler';
import { ListTemplateVersionsHandler } from './application/queries/list-template-versions/list-template-versions.handler';
import { PreviewDraftHandler } from './application/queries/preview-draft/preview-draft.handler';
import { PreviewTemplateHandler } from './application/queries/preview-template/preview-template.handler';
import { SendEmailHandler } from './dispatch/application/commands/send-email/send-email.handler';
import { EMAIL_DISPATCH_QUERY_REPOSITORY } from './dispatch/application/queries/email-dispatch.read-model';
import { ListDispatchesHandler } from './dispatch/application/queries/list-dispatches/list-dispatches.handler';
import { EMAIL_DISPATCH_REPOSITORY } from './dispatch/domain/ports/email-dispatch.repository.port';
import { PrismaEmailDispatchQueryRepository } from './dispatch/infrastructure/prisma-email-dispatch.query-repository';
import { PrismaEmailDispatchRepository } from './dispatch/infrastructure/prisma-email-dispatch.repository';
import { EMAIL_TEMPLATE_REPOSITORY } from './domain/ports/email-template.repository.port';
import { COMMUNICATION_MAILER } from './domain/ports/mailer.port';
import { TemplatePublishingService } from './domain/services/template-publishing.service';
import { CommunicationMailer } from './infrastructure/mail/communication-mailer';
import { PrismaEmailTemplateQueryRepository } from './infrastructure/persistence/prisma-email-template.query-repository';
import { PrismaEmailTemplateRepository } from './infrastructure/persistence/prisma-email-template.repository';
import { SeedTemplatesService } from './infrastructure/seed/seed-templates.service';
import { MjmlCompilerService } from './infrastructure/template-engine/mjml-compiler.service';
import { MustacheTemplateEngine } from './infrastructure/template-engine/mustache-template-engine';
import { AdminDispatchController } from './presentation/http/admin-dispatch.controller';
import { AdminTemplatesController } from './presentation/http/admin-templates.controller';

const QueryHandlers = [
  GetPublishedTemplateHandler,
  GetTemplateByIdHandler,
  ListTemplateVersionsHandler,
  ListTemplateTypesHandler,
  PreviewTemplateHandler,
  PreviewDraftHandler,
  ListDispatchesHandler,
];

@Module({
  // IdentityModule : réutilise AdminGuard (JWT + rôle ADMIN) pour protéger l'admin.
  imports: [CqrsModule, IdentityModule],
  controllers: [AdminTemplatesController, AdminDispatchController],
  providers: [
    ...QueryHandlers,
    ...CommandHandlers,
    SendEmailHandler,
    { provide: EMAIL_TEMPLATE_REPOSITORY, useClass: PrismaEmailTemplateRepository },
    { provide: EMAIL_TEMPLATE_QUERY_REPOSITORY, useClass: PrismaEmailTemplateQueryRepository },
    { provide: EMAIL_DISPATCH_REPOSITORY, useClass: PrismaEmailDispatchRepository },
    { provide: EMAIL_DISPATCH_QUERY_REPOSITORY, useClass: PrismaEmailDispatchQueryRepository },
    { provide: TEMPLATE_ENGINE_PORT, useClass: MustacheTemplateEngine },
    { provide: MJML_COMPILER_PORT, useClass: MjmlCompilerService },
    { provide: COMMUNICATION_MAILER, useClass: CommunicationMailer },
    TemplatePublishingService,
    SeedTemplatesService,
  ],
  // Exporté pour que d'autres modules (identity) dispatchent SendEmailCommand.
  exports: [CqrsModule],
})
export class CommunicationModule {}
