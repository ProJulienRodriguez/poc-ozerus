/* Port d'envoi d'emails d'identité. Adapter dans infrastructure/ (délègue au module
   communication via SendEmailCommand : templates MJML versionnés + historique). */
export const MAILER = Symbol('MAILER');

export interface IdentityMailerPort {
  sendActivation(email: string, name: string, link: string): void;
  sendPasswordReset(email: string, name: string, link: string): void;
  sendInvite(email: string, role: string, link: string): void;
}
