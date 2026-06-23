import type { EmailDispatchStatus } from '../../domain/email-dispatch.aggregate';

export interface EmailDispatchReadModel {
  id: string;
  templateName: string;
  templateVersion: number;
  locale: string;
  to: string;
  messageId: string | null;
  status: EmailDispatchStatus;
  error: string | null;
  correlationId: string | null;
  dispatchedAt: Date;
}

export const EMAIL_DISPATCH_QUERY_REPOSITORY = Symbol('EMAIL_DISPATCH_QUERY_REPOSITORY');

export interface ListDispatchesFilter {
  to?: string;
  templateName?: string;
  status?: EmailDispatchStatus;
  page: number;
  pageSize: number;
}

export interface PagedDispatches {
  items: EmailDispatchReadModel[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EmailDispatchQueryRepository {
  list(filter: ListDispatchesFilter): Promise<PagedDispatches>;
}
