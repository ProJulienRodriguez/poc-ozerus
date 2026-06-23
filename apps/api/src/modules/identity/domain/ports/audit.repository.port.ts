/* Port du journal d'audit (alimenté par les domain events). Adapter Prisma en infra. */
export const AUDIT_REPOSITORY = Symbol('AUDIT_REPOSITORY');

export interface AuditEntry {
  userId?: string | null;
  type: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Entrée d'audit exposée à l'utilisateur (vue personnelle « connexions & actions »). */
export interface AuditLogView {
  id: string;
  type: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface AuditRepositoryPort {
  record(entry: AuditEntry): Promise<void>;
  /** Dernières entrées d'audit d'un compte (les plus récentes d'abord). */
  findRecentByUser(userId: string, limit: number): Promise<AuditLogView[]>;
}
