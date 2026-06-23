import { Command } from '@nestjs/cqrs';

/** (Admin) Révoque (supprime) une invitation non encore utilisée. */
export class RevokeInviteCommand extends Command<void> {
  constructor(public readonly inviteId: string) {
    super();
  }
}
