import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  AUDIT_REPOSITORY,
  AuditLogView,
  AuditRepositoryPort,
} from '../../../domain/ports/audit.repository.port';
import { GetAccountActivityQuery } from './get-account-activity.query';

@QueryHandler(GetAccountActivityQuery)
export class GetAccountActivityHandler
  implements IQueryHandler<GetAccountActivityQuery, AuditLogView[]>
{
  constructor(@Inject(AUDIT_REPOSITORY) private readonly audit: AuditRepositoryPort) {}

  execute(query: GetAccountActivityQuery): Promise<AuditLogView[]> {
    return this.audit.findRecentByUser(query.accountId, query.limit);
  }
}
