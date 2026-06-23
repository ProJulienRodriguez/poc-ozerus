import { Injectable } from '@nestjs/common';
import { MailService } from '../../../../core/mail/mail.service';
import type { CommunicationMailerPort, SendMailInput } from '../../domain/ports/mailer.port';

/* Adapter du port mailer du module communication : délègue au MailService
   nodemailer du core (capturé par MailHog en dev). */
@Injectable()
export class CommunicationMailer implements CommunicationMailerPort {
  constructor(private readonly mail: MailService) {}

  async send(input: SendMailInput): Promise<void> {
    await this.mail.sendHtml(input.to, input.subject, input.html);
  }
}
