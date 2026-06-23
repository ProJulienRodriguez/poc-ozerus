import { Injectable } from '@nestjs/common';
import { EmailTemplateBody, EmailTemplateVersion } from '@prisma/client';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import type { EmailTemplateQueryRepository } from '../../application/queries/email-template.query-repository';
import type {
  EmailTemplateReadModel,
  EmailTemplateVersionReadModel,
  TemplateTypeStatus,
  TemplateTypeSummary,
} from '../../application/queries/email-template.read-model';

type VersionWithBodies = EmailTemplateVersion & { bodies: EmailTemplateBody[] };

const STATUS_RANK: Record<string, number> = { PUBLISHED: 3, DRAFT: 2, ARCHIVED: 1 };
const RANK_STATUS: Record<number, TemplateTypeStatus> = {
  3: 'PUBLISHED',
  2: 'DRAFT',
  1: 'ARCHIVED',
};

@Injectable()
export class PrismaEmailTemplateQueryRepository implements EmailTemplateQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findVersionById(id: string): Promise<EmailTemplateVersionReadModel | null> {
    const row = await this.prisma.emailTemplateVersion.findUnique({
      where: { id },
      include: { bodies: true },
    });
    return row ? this.toVersionModel(row) : null;
  }

  async findAllVersionsByName(name: string): Promise<EmailTemplateVersionReadModel[]> {
    const rows = await this.prisma.emailTemplateVersion.findMany({
      where: { name },
      orderBy: { version: 'desc' },
      include: { bodies: true },
    });
    return rows.map((r) => this.toVersionModel(r));
  }

  async findPublishedByNameAndLocale(
    name: string,
    locale: string,
  ): Promise<EmailTemplateReadModel | null> {
    const row = await this.prisma.emailTemplateVersion.findFirst({
      where: { name, status: 'PUBLISHED', bodies: { some: { locale } } },
      include: { bodies: { where: { locale } } },
    });
    const body = row?.bodies[0];
    return row && body ? this.toFlatModel(row, body) : null;
  }

  async findByNameLocaleVersion(
    name: string,
    locale: string,
    version: number,
  ): Promise<EmailTemplateReadModel | null> {
    const row = await this.prisma.emailTemplateVersion.findFirst({
      where: { name, version, bodies: { some: { locale } } },
      include: { bodies: { where: { locale } } },
    });
    const body = row?.bodies[0];
    return row && body ? this.toFlatModel(row, body) : null;
  }

  async findDistinctTypes(): Promise<TemplateTypeSummary[]> {
    const rows = await this.prisma.emailTemplateVersion.findMany({
      include: { bodies: { select: { locale: true } } },
    });

    const byName = new Map<
      string,
      {
        locales: Set<string>;
        updatedAt: Date;
        rank: number;
        publishedVersion: number | null;
        hasDraft: boolean;
      }
    >();
    for (const row of rows) {
      const entry = byName.get(row.name) ?? {
        locales: new Set<string>(),
        updatedAt: row.updatedAt,
        rank: 0,
        publishedVersion: null,
        hasDraft: false,
      };
      for (const b of row.bodies) {
        entry.locales.add(b.locale);
      }
      if (row.updatedAt > entry.updatedAt) {
        entry.updatedAt = row.updatedAt;
      }
      entry.rank = Math.max(entry.rank, STATUS_RANK[row.status] ?? 1);
      if (row.status === 'PUBLISHED') {
        entry.publishedVersion = row.version;
      } else if (row.status === 'DRAFT') {
        entry.hasDraft = true;
      }
      byName.set(row.name, entry);
    }

    return [...byName.entries()]
      .map(([name, e]) => ({
        name,
        locales: [...e.locales].sort(),
        updatedAt: e.updatedAt,
        status: RANK_STATUS[e.rank],
        publishedVersion: e.publishedVersion,
        hasDraft: e.hasDraft,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private toFlatModel(
    version: EmailTemplateVersion,
    body: EmailTemplateBody,
  ): EmailTemplateReadModel {
    return {
      id: version.id,
      name: version.name,
      locale: body.locale,
      subject: body.subject,
      bodyMjml: body.bodyMjml,
      bodyState: (body.bodyState as Record<string, unknown> | null) ?? null,
      variables: body.variables,
      version: version.version,
      status: version.status,
      engineVersion: body.engineVersion,
      compiledHtml: body.compiledHtml,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
    };
  }

  private toVersionModel(row: VersionWithBodies): EmailTemplateVersionReadModel {
    return {
      id: row.id,
      name: row.name,
      version: row.version,
      status: row.status,
      publishedAt: row.publishedAt,
      archivedAt: row.archivedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      bodies: (row.bodies ?? [])
        .slice()
        .sort((a, b) => a.locale.localeCompare(b.locale))
        .map((b) => ({
          id: b.id,
          locale: b.locale,
          subject: b.subject,
          bodyMjml: b.bodyMjml,
          bodyState: (b.bodyState as Record<string, unknown> | null) ?? null,
          variables: b.variables,
          engineVersion: b.engineVersion,
          compiledHtml: b.compiledHtml,
        })),
    };
  }
}
