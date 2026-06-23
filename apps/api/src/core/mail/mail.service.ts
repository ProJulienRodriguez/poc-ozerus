/* Notifications email (US 4.6). Sans SMTP_URL configurée, les envois sont
   simplement journalisés — aucun email ne part (no-op sûr pour le dev). */
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter = process.env.SMTP_URL
    ? nodemailer.createTransport(process.env.SMTP_URL)
    : null;
  private readonly from = process.env.MAIL_FROM ?? 'Ozerus <no-reply@ozerus.invalid>';

  /** Envoi best-effort : une erreur SMTP ne doit jamais casser l'action métier. */
  send(to: string[], subject: string, text: string): void {
    if (!to.length) return;
    if (!this.transporter) {
      this.logger.log(`[mail désactivé] À: ${to.join(', ')} — ${subject}`);
      return;
    }
    this.transporter
      .sendMail({ from: this.from, to: to.join(', '), subject, text })
      .catch((err: Error) => this.logger.warn(`Envoi email échoué (${subject}) : ${err.message}`));
  }

  /** Envoi HTML (utilisé par le module communication). Rejette en cas d'erreur SMTP
     pour que l'appelant puisse journaliser l'échec dans l'historique des envois. */
  async sendHtml(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[mail désactivé] À: ${to} — ${subject}`);
      return;
    }
    await this.transporter.sendMail({ from: this.from, to, subject, html });
  }
}
