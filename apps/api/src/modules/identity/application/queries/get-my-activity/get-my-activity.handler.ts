import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  AUDIT_REPOSITORY,
  AuditLogView,
  AuditRepositoryPort,
} from '../../../domain/ports/audit.repository.port';
import { GetMyActivityQuery } from './get-my-activity.query';

@QueryHandler(GetMyActivityQuery)
export class GetMyActivityHandler implements IQueryHandler<GetMyActivityQuery, AuditLogView[]> {
  constructor(@Inject(AUDIT_REPOSITORY) private readonly audit: AuditRepositoryPort) {}

  execute(query: GetMyActivityQuery): Promise<AuditLogView[]> {
    return this.audit.findRecentByUser(query.accountId, query.limit);
  }
}
