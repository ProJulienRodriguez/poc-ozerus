import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { SendEmailCommand } from '../../../communication/dispatch/application/commands/send-email/send-email.command';
import { IdentityMailerPort } from '../../domain/ports/mailer.port';

/* Adapter mailer d'identité : délègue désormais au module communication
   (templates MJML versionnés + historique des envois) via SendEmailCommand,
   au lieu d'envoyer du texte brut. Best-effort : un échec d'envoi ne doit jamais
   casser l'action métier — on journalise et on continue. */
@Injectable()
export class IdentityMailer implements IdentityMailerPort {
  private readonly logger = new Logger(IdentityMailer.name);

  constructor(private readonly commandBus: CommandBus) {}

  sendActivation(email: string, name: string, link: string): void {
    this.dispatch('account_activation', email, { name, activationLink: link, expiresInDays: 4 });
  }

  sendPasswordReset(email: string, name: string, link: string): void {
    this.dispatch('password_reset', email, { name, resetLink: link, expiresInHours: 24 });
  }

  sendInvite(email: string, role: string, link: string): void {
    const roleLabel = role === 'TRAINER' ? 'formateur' : 'apprenant';
    this.dispatch('user_invitation', email, { roleLabel, invitationLink: link, expiresInDays: 4 });
  }

  /** Envoi asynchrone non bloquant : on n'attend pas le SMTP côté action métier. */
  private dispatch(
    templateName: string,
    to: string,
    variables: Record<string, string | number | boolean>,
  ): void {
    void this.commandBus
      .execute(new SendEmailCommand(templateName, to, 'fr', variables))
      .catch((err: Error) =>
        this.logger.warn(`Envoi email "${templateName}" échoué (${to}) : ${err.message}`),
      );
  }
}
