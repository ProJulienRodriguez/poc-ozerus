import { IEvent } from '@nestjs/cqrs';

/** Actions de sécurité self-service à tracer dans le journal d'audit. */
export type SecurityAction =
  | 'SESSIONS_REVOKED'
  | 'RECOVERY_CODES_REGENERATED'
  | 'TRUSTED_DEVICE_REVOKED';

/** Émis lors d'une action de sécurité déclenchée par l'utilisateur sur son compte. */
export class SecurityActionEvent implements IEvent {
  constructor(
    public readonly accountId: string,
    public readonly action: SecurityAction,
  ) {}
}
