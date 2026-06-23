import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { parseOrBadRequest } from '../../../../core/validation';
import { AdminGuard } from '../../../identity/presentation/guards/access-token.guard';
import { AddLocaleCommand } from '../../application/commands/add-locale/add-locale.command';
import { ArchiveTemplateCommand } from '../../application/commands/archive-template/archive-template.command';
import { CreateDraftTemplateCommand } from '../../application/commands/create-draft-template/create-draft-template.command';
import { PublishTemplateCommand } from '../../application/commands/publish-template/publish-template.command';
import { UpdateBodySamplesCommand } from '../../application/commands/update-body-samples/update-body-samples.command';
import { UpdateDraftTemplateCommand } from '../../application/commands/update-draft-template/update-draft-template.command';
import {
  EMAIL_TEMPLATE_QUERY_REPOSITORY,
  type EmailTemplateQueryRepository,
} from '../../application/queries/email-template.query-repository';
import type {
  EmailTemplateVersionReadModel,
  TemplateTypeSummary,
} from '../../application/queries/email-template.read-model';
import { ListTemplateTypesQuery } from '../../application/queries/list-template-types/list-template-types.query';
import { ListTemplateVersionsQuery } from '../../application/queries/list-template-versions/list-template-versions.query';
import { PreviewDraftQuery } from '../../application/queries/preview-draft/preview-draft.query';
import {
  PreviewTemplateQuery,
  type PreviewTemplateResult,
} from '../../application/queries/preview-template/preview-template.query';
import {
  SendEmailCommand,
  type SendEmailResult,
} from '../../dispatch/application/commands/send-email/send-email.command';
import {
  TEMPLATE_TYPES,
  type TemplateTypeDefinition,
} from '../../domain/template-types/template-type.registry';
import type { MailBlock } from '../../infrastructure/mail-rendering/mail-block.types';
import { renderBlocksToMjml } from '../../infrastructure/mail-rendering/mail-block-renderer';
import {
  addLocaleSchema,
  createTemplateSchema,
  previewDraftSchema,
  testSendSchema,
  updateBodySchema,
  updateSamplesSchema,
} from '../schemas/communication.schemas';

interface BodyInput {
  blocks?: MailBlock[];
  bodyMjml?: string;
  bodyState?: Record<string, unknown> | null;
  samples?: Record<string, string>;
}

function withSamples(
  state: Record<string, unknown> | null,
  samples?: Record<string, string>,
): Record<string, unknown> | null {
  if (!samples) {
    return state;
  }
  return { ...(state ?? {}), samples };
}

/** Résout le payload éditeur vers le couple (bodyMjml, bodyState) stocké. */
function resolveBody(input: BodyInput): {
  bodyMjml: string;
  bodyState: Record<string, unknown> | null;
} {
  if (input.blocks && input.blocks.length > 0) {
    return {
      bodyMjml: renderBlocksToMjml(input.blocks),
      bodyState: withSamples({ blocks: input.blocks }, input.samples),
    };
  }
  if (input.bodyMjml) {
    return {
      bodyMjml: input.bodyMjml,
      bodyState: withSamples(input.bodyState ?? null, input.samples),
    };
  }
  throw new BadRequestException('Corps manquant : fournir "blocks" ou "bodyMjml".');
}

/** Comme resolveBody, mais renvoie des champs vides si rien n'est fourni (addLocale copyFrom). */
function resolveBodyOptional(input: BodyInput): {
  bodyMjml?: string;
  bodyState?: Record<string, unknown> | null;
} {
  if (input.blocks && input.blocks.length > 0) {
    return {
      bodyMjml: renderBlocksToMjml(input.blocks),
      bodyState: withSamples({ blocks: input.blocks }, input.samples),
    };
  }
  if (input.bodyMjml) {
    return {
      bodyMjml: input.bodyMjml,
      bodyState: withSamples(input.bodyState ?? null, input.samples),
    };
  }
  return {};
}

@Controller('admin/communication/templates')
@UseGuards(AdminGuard)
export class AdminTemplatesController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    @Inject(EMAIL_TEMPLATE_QUERY_REPOSITORY)
    private readonly templateQuery: EmailTemplateQueryRepository,
  ) {}

  @Get('types')
  async listTypes(): Promise<TemplateTypeSummary[]> {
    return this.queryBus.execute(new ListTemplateTypesQuery());
  }

  /** Catalogue figé des types de templates (registre code) : contrat de variables + protection. */
  @Get('catalog')
  catalog(): readonly TemplateTypeDefinition[] {
    return TEMPLATE_TYPES;
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  async previewDraft(@Body() body: unknown): Promise<PreviewTemplateResult> {
    const dto = parseOrBadRequest(previewDraftSchema, body);
    const { bodyMjml } = resolveBody(dto);
    return this.queryBus.execute(new PreviewDraftQuery(dto.subject, bodyMjml, dto.variables ?? {}));
  }

  @Post('test-send')
  @HttpCode(HttpStatus.OK)
  async testSend(
    @Body() body: unknown,
  ): Promise<{ status: 'sent' | 'failed'; messageId?: string; error?: string }> {
    const dto = parseOrBadRequest(testSendSchema, body);
    try {
      const result = await this.commandBus.execute<SendEmailCommand, SendEmailResult>(
        new SendEmailCommand(dto.templateName, dto.to, dto.locale, dto.variables ?? {}, dto.templateVersion),
      );
      return { status: 'sent', messageId: result.messageId };
    } catch (error) {
      return { status: 'failed', error: (error as Error).message };
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown): Promise<EmailTemplateVersionReadModel> {
    const dto = parseOrBadRequest(createTemplateSchema, body);
    const { id } = await this.commandBus.execute<
      CreateDraftTemplateCommand,
      { id: string; version: number }
    >(
      new CreateDraftTemplateCommand(
        dto.name,
        dto.bodies.map((b) => {
          const resolved = resolveBody(b);
          return {
            locale: b.locale,
            subject: b.subject,
            bodyMjml: resolved.bodyMjml,
            variables: b.variables,
            bodyState: resolved.bodyState,
          };
        }),
      ),
    );
    return this.requireVersion(id);
  }

  @Get(':name')
  async getTimeline(@Param('name') name: string): Promise<EmailTemplateVersionReadModel[]> {
    return this.queryBus.execute(new ListTemplateVersionsQuery(name));
  }

  @Put(':name/versions/:version/bodies/:locale')
  @HttpCode(HttpStatus.OK)
  async updateBody(
    @Param('name') name: string,
    @Param('version') version: string,
    @Param('locale') locale: string,
    @Body() body: unknown,
  ): Promise<EmailTemplateVersionReadModel> {
    const dto = parseOrBadRequest(updateBodySchema, body);
    const target = await this.resolveVersion(name, this.toVersion(version));
    const resolved = resolveBody(dto);
    await this.commandBus.execute(
      new UpdateDraftTemplateCommand(
        target.id,
        locale,
        dto.subject,
        resolved.bodyMjml,
        dto.variables,
        resolved.bodyState,
      ),
    );
    return this.requireVersion(target.id);
  }

  @Post(':name/versions/:version/bodies')
  @HttpCode(HttpStatus.CREATED)
  async addLocale(
    @Param('name') name: string,
    @Param('version') version: string,
    @Body() body: unknown,
  ): Promise<EmailTemplateVersionReadModel> {
    const dto = parseOrBadRequest(addLocaleSchema, body);
    const target = await this.resolveVersion(name, this.toVersion(version));
    const resolved = resolveBodyOptional(dto);
    await this.commandBus.execute(
      new AddLocaleCommand(
        target.id,
        dto.locale,
        dto.subject,
        resolved.bodyMjml,
        dto.variables,
        resolved.bodyState ?? null,
        dto.copyFrom,
      ),
    );
    return this.requireVersion(target.id);
  }

  @Put(':name/versions/:version/bodies/:locale/samples')
  @HttpCode(HttpStatus.OK)
  async updateSamples(
    @Param('name') name: string,
    @Param('version') version: string,
    @Param('locale') locale: string,
    @Body() body: unknown,
  ): Promise<EmailTemplateVersionReadModel> {
    const dto = parseOrBadRequest(updateSamplesSchema, body);
    const target = await this.resolveVersion(name, this.toVersion(version));
    await this.commandBus.execute(new UpdateBodySamplesCommand(target.id, locale, dto.samples));
    return this.requireVersion(target.id);
  }

  @Post(':name/versions/:version/publish')
  @HttpCode(HttpStatus.OK)
  async publish(
    @Param('name') name: string,
    @Param('version') version: string,
  ): Promise<EmailTemplateVersionReadModel> {
    const target = await this.resolveVersion(name, this.toVersion(version));
    await this.commandBus.execute(new PublishTemplateCommand(target.id));
    return this.requireVersion(target.id);
  }

  @Post(':name/versions/:version/archive')
  @HttpCode(HttpStatus.OK)
  async archive(
    @Param('name') name: string,
    @Param('version') version: string,
  ): Promise<EmailTemplateVersionReadModel> {
    const target = await this.resolveVersion(name, this.toVersion(version));
    await this.commandBus.execute(new ArchiveTemplateCommand(target.id));
    return this.requireVersion(target.id);
  }

  @Post(':name/versions/:version/preview')
  @HttpCode(HttpStatus.OK)
  async preview(
    @Param('name') name: string,
    @Param('version') version: string,
    @Query('locale') locale: string,
  ): Promise<PreviewTemplateResult> {
    if (!locale) {
      throw new BadRequestException('Paramètre "locale" requis');
    }
    return this.queryBus.execute(new PreviewTemplateQuery(name, this.toVersion(version), locale));
  }

  private toVersion(value: string): number {
    const n = Number.parseInt(value, 10);
    if (!Number.isInteger(n) || n < 1) {
      throw new BadRequestException(`Numéro de version invalide : "${value}"`);
    }
    return n;
  }

  private async resolveVersion(
    name: string,
    version: number,
  ): Promise<EmailTemplateVersionReadModel> {
    const timeline = await this.queryBus.execute<
      ListTemplateVersionsQuery,
      EmailTemplateVersionReadModel[]
    >(new ListTemplateVersionsQuery(name));
    const found = timeline.find((v) => v.version === version);
    if (!found) {
      throw new NotFoundException(`Template ${name} v${version} introuvable`);
    }
    return found;
  }

  private async requireVersion(id: string): Promise<EmailTemplateVersionReadModel> {
    const version = await this.templateQuery.findVersionById(id);
    if (!version) {
      throw new NotFoundException(`Version de template ${id} introuvable`);
    }
    return version;
  }
}
