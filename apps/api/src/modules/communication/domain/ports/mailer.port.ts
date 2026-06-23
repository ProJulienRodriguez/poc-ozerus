/* Port d'envoi d'email (HTML) du module communication. Adapter dans
   infrastructure/mail (wrappe le MailService nodemailer du core). */
export const COMMUNICATION_MAILER = Symbol('COMMUNICATION_MAILER');

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

export interface CommunicationMailerPort {
  send(input: SendMailInput): Promise<void>;
}
