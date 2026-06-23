import { IEvent } from '@nestjs/cqrs';

/** Émis quand un admin crée une invitation nominative (avec email destinataire).
    Le handler email construit le lien d'inscription à partir du token d'invitation.
    Les invitations « ouvertes » (sans email) ne déclenchent pas cet event. */
export class InviteCreatedEvent implements IEvent {
  constructor(
    public readonly inviteId: string,
    public readonly email: string,
    public readonly role: string,
  ) {}
}
