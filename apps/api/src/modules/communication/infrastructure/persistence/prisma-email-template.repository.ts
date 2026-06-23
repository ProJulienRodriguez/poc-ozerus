import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { EmailTemplateVersion } from '../../domain/email-template-version.aggregate';
import type { EmailTemplateRepositoryPort } from '../../domain/ports/email-template.repository.port';
import { EmailTemplateId } from '../../domain/value-objects/email-template-id.value-object';
import { rowToDomain } from './email-template.mapper';

@Injectable()
export class PrismaEmailTemplateRepository implements EmailTemplateRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: EmailTemplateId): Promise<EmailTemplateVersion | null> {
    const row = await this.prisma.emailTemplateVersion.findUnique({
      where: { id: id.value },
      include: { bodies: true },
    });
    return row ? rowToDomain(row) : null;
  }

  async findPublishedByName(name: string): Promise<EmailTemplateVersion | null> {
    const row = await this.prisma.emailTemplateVersion.findFirst({
      where: { name, status: 'PUBLISHED' },
      include: { bodies: true },
    });
    return row ? rowToDomain(row) : null;
  }

  async findLatestByName(name: string): Promise<EmailTemplateVersion | null> {
    const row = await this.prisma.emailTemplateVersion.findFirst({
      where: { name },
      orderBy: { version: 'desc' },
      include: { bodies: true },
    });
    return row ? rowToDomain(row) : null;
  }

  /** Upsert transactionnel de la version + remplacement de ses corps. */
  async save(version: EmailTemplateVersion): Promise<void> {
    const snapshot = version.snapshot();
    await this.prisma.$transaction(async (tx) => {
      await tx.emailTemplateVersion.upsert({
        where: { id: snapshot.id },
        create: {
          id: snapshot.id,
          name: snapshot.name,
          version: snapshot.version,
          status: snapshot.status as never,
          publishedAt: snapshot.publishedAt,
          archivedAt: snapshot.archivedAt,
        },
        update: {
          status: snapshot.status as never,
          publishedAt: snapshot.publishedAt,
          archivedAt: snapshot.archivedAt,
        },
      });

      const keptIds = snapshot.bodies.map((b) => b.id);
      await tx.emailTemplateBody.deleteMany({
        where: { versionId: snapshot.id, id: { notIn: keptIds.length > 0 ? keptIds : ['__none__'] } },
      });

      for (const b of snapshot.bodies) {
        const data = {
          locale: b.locale,
          subject: b.subject,
          bodyMjml: b.bodyMjml,
          bodyState: (b.bodyState ?? Prisma.JsonNull) as Prisma.InputJsonValue | typeof Prisma.JsonNull,
          variables: b.variables,
          engineVersion: b.engineVersion,
          compiledHtml: b.compiledHtml,
        };
        await tx.emailTemplateBody.upsert({
          where: { id: b.id },
          create: { id: b.id, versionId: snapshot.id, ...data },
          update: data,
        });
      }
    });
  }
}
