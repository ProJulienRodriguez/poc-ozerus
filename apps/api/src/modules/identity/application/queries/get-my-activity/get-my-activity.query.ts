import { Query } from '@nestjs/cqrs';
import { AuditLogView } from '../../../domain/ports/audit.repository.port';

/** Journal d'activité personnel (connexions & actions) du compte courant. */
export class GetMyActivityQuery extends Query<AuditLogView[]> {
  constructor(
    public readonly accountId: string,
    public readonly limit: number,
  ) {
    super();
  }
}
