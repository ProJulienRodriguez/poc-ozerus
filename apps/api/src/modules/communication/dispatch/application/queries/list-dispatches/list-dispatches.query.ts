import type { EmailDispatchStatus } from '../../../domain/email-dispatch.aggregate';

export class ListDispatchesQuery {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly to?: string,
    public readonly templateName?: string,
    public readonly status?: EmailDispatchStatus,
  ) {}
}
