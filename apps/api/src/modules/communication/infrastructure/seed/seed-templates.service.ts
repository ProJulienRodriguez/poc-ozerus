import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateDraftTemplateCommand } from '../../application/commands/create-draft-template/create-draft-template.command';
import { PublishTemplateCommand } from '../../application/commands/publish-template/publish-template.command';
import {
  EMAIL_TEMPLATE_REPOSITORY,
  type EmailTemplateRepositoryPort,
} from '../../domain/ports/email-template.repository.port';
import type { MailBlock, MailInline } from '../mail-rendering/mail-block.types';
import { renderBlocksToMjml } from '../mail-rendering/mail-block-renderer';

interface TemplateSeed {
  name: string;
  locale: string;
  subject: string;
  variables: string[];
  blocks: MailBlock[];
}

const t = (value: string): MailInline => ({ type: 'text', value });
const v = (name: string): MailInline => ({ type: 'variable', name });
const bv = (name: string): MailInline => ({ type: 'variable', name, bold: true });
const h1 = (...content: MailInline[]): MailBlock => ({ type: 'heading', level: 1, content });
const p = (...content: MailInline[]): MailBlock => ({ type: 'paragraph', content });
const pMuted = (...content: MailInline[]): MailBlock => ({
  type: 'paragraph',
  content,
  note: 'muted',
});
const pFaint = (...content: MailInline[]): MailBlock => ({
  type: 'paragraph',
  content,
  note: 'faint',
});
const btn = (label: string, href: string): MailBlock => ({ type: 'button', label, href });

const SAMPLE_DEFAULTS: Record<string, string> = {
  name: 'Camille Durand',
  appName: 'Ozerus',
  supportEmail: 'support@ozerus.example',
  currentYear: '2026',
  activationLink: 'https://app.ozerus.example/activate?token=abc123',
  resetLink: 'https://app.ozerus.example/reset-password?token=abc123',
  invitationLink: 'https://app.ozerus.example/register?token=abc123',
  roleLabel: 'apprenant',
  expiresInHours: '24',
  expiresInDays: '4',
  learnerName: 'Camille Durand',
  taskLabel: 'Premier agent RAG',
  reviewLink: 'https://app.ozerus.example/trainer',
  submissionsLink: 'https://app.ozerus.example/submission',
};

const buildSamples = (variables: string[]): Record<string, string> =>
  Object.fromEntries(variables.map((name) => [name, SAMPLE_DEFAULTS[name] ?? '']));

const ACTIVATION_VARS = ['name', 'activationLink', 'expiresInDays', 'appName', 'supportEmail', 'currentYear'];
const RESET_VARS = ['name', 'resetLink', 'expiresInHours', 'appName', 'supportEmail', 'currentYear'];
const INVITE_VARS = ['roleLabel', 'invitationLink', 'expiresInDays', 'appName', 'supportEmail', 'currentYear'];
const SUBMISSION_RECEIVED_VARS = ['learnerName', 'taskLabel', 'reviewLink', 'appName', 'supportEmail', 'currentYear'];
const SUBMISSION_REVIEWED_VARS = ['name', 'taskLabel', 'submissionsLink', 'appName', 'supportEmail', 'currentYear'];

const DEFAULT_TEMPLATES: TemplateSeed[] = [
  {
    name: 'account_activation',
    locale: 'fr',
    subject: 'Activez votre compte — {{appName}}',
    variables: ACTIVATION_VARS,
    blocks: [
      h1(t('Bienvenue sur '), v('appName')),
      p(t('Bonjour '), bv('name'), t(',')),
      p(
        t("Un compte vient d'être créé pour vous. Cliquez sur le bouton ci-dessous pour définir votre mot de passe et activer votre accès."),
      ),
      btn('Activer mon compte', '{{activationLink}}'),
      pMuted(t('Ce lien expire dans '), v('expiresInDays'), t(' jours.')),
      pFaint(t("Si vous n'êtes pas à l'origine de cette création, vous pouvez ignorer cet email.")),
    ],
  },
  {
    name: 'account_activation',
    locale: 'en',
    subject: 'Activate your account — {{appName}}',
    variables: ACTIVATION_VARS,
    blocks: [
      h1(t('Welcome to '), v('appName')),
      p(t('Hello '), bv('name'), t(',')),
      p(
        t('An account has just been created for you. Click the button below to set your password and activate your access.'),
      ),
      btn('Activate my account', '{{activationLink}}'),
      pMuted(t('This link expires in '), v('expiresInDays'), t(' days.')),
      pFaint(t('If you did not expect this, you can ignore this email.')),
    ],
  },
  {
    name: 'password_reset',
    locale: 'fr',
    subject: 'Réinitialisation de votre mot de passe — {{appName}}',
    variables: RESET_VARS,
    blocks: [
      h1(t('Réinitialisation de mot de passe')),
      p(t('Bonjour '), bv('name'), t(',')),
      p(
        t('Une réinitialisation de mot de passe a été demandée pour votre compte. Cliquez sur le bouton ci-dessous pour en définir un nouveau.'),
      ),
      btn('Réinitialiser mon mot de passe', '{{resetLink}}'),
      pMuted(t('Ce lien expire dans '), v('expiresInHours'), t(' heures.')),
      pFaint(t("Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.")),
    ],
  },
  {
    name: 'password_reset',
    locale: 'en',
    subject: 'Reset your password — {{appName}}',
    variables: RESET_VARS,
    blocks: [
      h1(t('Password reset')),
      p(t('Hello '), bv('name'), t(',')),
      p(
        t('A password reset was requested for your account. Click the button below to choose a new one.'),
      ),
      btn('Reset my password', '{{resetLink}}'),
      pMuted(t('This link expires in '), v('expiresInHours'), t(' hours.')),
      pFaint(t('If you did not request this, you can ignore this email.')),
    ],
  },
  {
    name: 'user_invitation',
    locale: 'fr',
    subject: 'Votre invitation — {{appName}}',
    variables: INVITE_VARS,
    blocks: [
      h1(t('Vous êtes invité·e sur '), v('appName')),
      p(
        t('Vous êtes invité·e à rejoindre '),
        v('appName'),
        t(' en tant que '),
        bv('roleLabel'),
        t('. Créez votre compte (nom + mot de passe) via le bouton ci-dessous.'),
      ),
      btn('Créer mon compte', '{{invitationLink}}'),
      pMuted(t('Ce lien expire dans '), v('expiresInDays'), t(' jours.')),
      pFaint(t("Si vous ne vous attendiez pas à cette invitation, vous pouvez ignorer cet email.")),
    ],
  },
  {
    name: 'user_invitation',
    locale: 'en',
    subject: 'Your invitation — {{appName}}',
    variables: INVITE_VARS,
    blocks: [
      h1(t('You are invited to '), v('appName')),
      p(
        t('You are invited to join '),
        v('appName'),
        t(' as a '),
        bv('roleLabel'),
        t('. Create your account (name + password) using the button below.'),
      ),
      btn('Create my account', '{{invitationLink}}'),
      pMuted(t('This link expires in '), v('expiresInDays'), t(' days.')),
      pFaint(t('If you did not expect this invitation, you can ignore this email.')),
    ],
  },
  {
    name: 'submission_received',
    locale: 'fr',
    subject: 'Nouvelle soumission de {{learnerName}} — {{appName}}',
    variables: SUBMISSION_RECEIVED_VARS,
    blocks: [
      h1(t('Nouvelle soumission à revoir')),
      p(bv('learnerName'), t(' vient de soumettre l’exercice '), bv('taskLabel'), t('.')),
      p(t('Elle vous attend dans la file de revue de votre espace formateur.')),
      btn('Revoir la soumission', '{{reviewLink}}'),
      pFaint(t('Vous recevez cet email car vous êtes formateur ou administrateur sur '), v('appName'), t('.')),
    ],
  },
  {
    name: 'submission_received',
    locale: 'en',
    subject: 'New submission from {{learnerName}} — {{appName}}',
    variables: SUBMISSION_RECEIVED_VARS,
    blocks: [
      h1(t('New submission to review')),
      p(bv('learnerName'), t(' just submitted the exercise '), bv('taskLabel'), t('.')),
      p(t('It is waiting in your trainer review queue.')),
      btn('Review the submission', '{{reviewLink}}'),
      pFaint(t('You receive this email because you are a trainer or admin on '), v('appName'), t('.')),
    ],
  },
  {
    name: 'submission_validated',
    locale: 'fr',
    subject: 'Ta soumission « {{taskLabel}} » est validée — {{appName}}',
    variables: SUBMISSION_REVIEWED_VARS,
    blocks: [
      h1(t('Soumission validée 🎉')),
      p(t('Bonjour '), bv('name'), t(',')),
      p(t('Bravo ! Ta soumission '), bv('taskLabel'), t(' a été validée par un formateur.')),
      p(t('Consulte le feedback associé dans « Mes soumissions ».')),
      btn('Voir mes soumissions', '{{submissionsLink}}'),
    ],
  },
  {
    name: 'submission_validated',
    locale: 'en',
    subject: 'Your submission "{{taskLabel}}" was approved — {{appName}}',
    variables: SUBMISSION_REVIEWED_VARS,
    blocks: [
      h1(t('Submission approved 🎉')),
      p(t('Hello '), bv('name'), t(',')),
      p(t('Well done! Your submission '), bv('taskLabel'), t(' was approved by a trainer.')),
      p(t('Check the related feedback in “My submissions”.')),
      btn('View my submissions', '{{submissionsLink}}'),
    ],
  },
  {
    name: 'submission_changes_requested',
    locale: 'fr',
    subject: 'Corrections demandées sur « {{taskLabel}} » — {{appName}}',
    variables: SUBMISSION_REVIEWED_VARS,
    blocks: [
      h1(t('Des corrections sont demandées')),
      p(t('Bonjour '), bv('name'), t(',')),
      p(t('Un formateur a revu ta soumission '), bv('taskLabel'), t(' et demande des corrections.')),
      p(t('Consulte le feedback dans « Mes soumissions », puis resoumets ton travail.')),
      btn('Voir le feedback', '{{submissionsLink}}'),
    ],
  },
  {
    name: 'submission_changes_requested',
    locale: 'en',
    subject: 'Changes requested on "{{taskLabel}}" — {{appName}}',
    variables: SUBMISSION_REVIEWED_VARS,
    blocks: [
      h1(t('Changes requested')),
      p(t('Hello '), bv('name'), t(',')),
      p(t('A trainer reviewed your submission '), bv('taskLabel'), t(' and requested changes.')),
      p(t('Check the feedback in “My submissions”, then resubmit your work.')),
      btn('View the feedback', '{{submissionsLink}}'),
    ],
  },
];

function groupByName(seeds: TemplateSeed[]): Map<string, TemplateSeed[]> {
  const grouped = new Map<string, TemplateSeed[]>();
  for (const seed of seeds) {
    const existing = grouped.get(seed.name);
    if (existing) {
      existing.push(seed);
    } else {
      grouped.set(seed.name, [seed]);
    }
  }
  return grouped;
}

/* Au démarrage : crée et publie les templates transactionnels par défaut s'ils
   n'existent pas encore (idempotent — on saute tout nom déjà présent). */
@Injectable()
export class SeedTemplatesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedTemplatesService.name);

  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY)
    private readonly repository: EmailTemplateRepositoryPort,
    private readonly commandBus: CommandBus,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    for (const [name, seeds] of groupByName(DEFAULT_TEMPLATES)) {
      const existing = await this.repository.findLatestByName(name);
      if (existing) {
        continue;
      }

      const { id } = await this.commandBus.execute<
        CreateDraftTemplateCommand,
        { id: string; version: number }
      >(
        new CreateDraftTemplateCommand(
          name,
          seeds.map((s) => ({
            locale: s.locale,
            subject: s.subject,
            bodyMjml: renderBlocksToMjml(s.blocks),
            variables: s.variables,
            bodyState: { blocks: s.blocks, samples: buildSamples(s.variables) },
          })),
        ),
      );
      await this.commandBus.execute(new PublishTemplateCommand(id));
      this.logger.log(`Template seedé : ${name} (${seeds.map((s) => s.locale).join(', ')})`);
    }
  }
}
