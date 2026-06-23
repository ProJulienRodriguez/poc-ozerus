import { Query } from '@nestjs/cqrs';
import { AuditLogView } from '../../../domain/ports/audit.repository.port';

/** (Admin) Journal d'activité (connexions & actions) d'un compte donné. */
export class GetAccountActivityQuery extends Query<AuditLogView[]> {
  constructor(
    public readonly accountId: string,
    public readonly limit: number,
  ) {
    super();
  }
}
