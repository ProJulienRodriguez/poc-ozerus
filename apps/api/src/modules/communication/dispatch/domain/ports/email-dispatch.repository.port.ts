import type { EmailDispatch } from '../email-dispatch.aggregate';

export const EMAIL_DISPATCH_REPOSITORY = Symbol('EMAIL_DISPATCH_REPOSITORY');

export interface EmailDispatchRepositoryPort {
  save(dispatch: EmailDispatch): Promise<void>;
}
