/* Registre des types de templates — SOURCE DE VÉRITÉ côté code.

   Les emails transactionnels sont déclenchés par le code (cf. IdentityMailer) avec
   un jeu de variables figé. Ce registre matérialise ce contrat : l'admin édite le
   CONTENU (sujet, corps, locales, versions) d'un type connu, mais ne peut ni inventer
   de nouveau type ni référencer des variables hors contrat.

   Garde-fous adossés à ce registre :
   - création restreinte aux types connus (CreateDraftTemplateHandler) ;
   - validation des variables à la publication (TemplatePublishingService) ;
   - protection de la version publiée d'un type `protected` contre l'archivage. */

export interface TemplateTypeVariable {
  /** Clé mustache, ex. "activationLink". */
  name: string;
  /** Si requise, le corps publié DOIT la référencer (sinon email cassé). */
  required: boolean;
  description: string;
}

export interface TemplateTypeDefinition {
  /** Clé technique (snake_case) — identifie le déclencheur côté code. */
  name: string;
  label: string;
  description: string;
  /** Transactionnel câblé au code : la version publiée ne peut pas être archivée. */
  protected: boolean;
  /** Contrat de variables propres au type (hors variables globales). */
  variables: TemplateTypeVariable[];
}

/** Toujours injectées par SendEmailHandler.buildGlobals — autorisées dans tout corps. */
export const GLOBAL_VARIABLES = ['appName', 'supportEmail', 'currentYear'] as const;

export const TEMPLATE_TYPES: readonly TemplateTypeDefinition[] = [
  {
    name: 'account_activation',
    label: 'Activation de compte',
    description: "Envoyé à la création d'un compte pour définir le mot de passe.",
    protected: true,
    variables: [
      { name: 'name', required: true, description: 'Nom du destinataire' },
      { name: 'activationLink', required: true, description: "Lien d'activation" },
      { name: 'expiresInDays', required: true, description: 'Durée de validité du lien (jours)' },
    ],
  },
  {
    name: 'password_reset',
    label: 'Réinitialisation de mot de passe',
    description: "Envoyé sur demande de réinitialisation du mot de passe.",
    protected: true,
    variables: [
      { name: 'name', required: true, description: 'Nom du destinataire' },
      { name: 'resetLink', required: true, description: 'Lien de réinitialisation' },
      { name: 'expiresInHours', required: true, description: 'Durée de validité du lien (heures)' },
    ],
  },
  {
    name: 'user_invitation',
    label: 'Invitation utilisateur',
    description: "Envoyé pour inviter une personne à créer son compte.",
    protected: true,
    variables: [
      { name: 'roleLabel', required: true, description: 'Libellé du rôle (apprenant / formateur)' },
      { name: 'invitationLink', required: true, description: "Lien d'inscription" },
      { name: 'expiresInDays', required: true, description: 'Durée de validité du lien (jours)' },
    ],
  },
  {
    name: 'submission_received',
    label: 'Nouvelle soumission (formateur)',
    description: "Envoyé aux formateurs quand un apprenant dépose une soumission à revoir.",
    protected: true,
    variables: [
      { name: 'learnerName', required: true, description: "Nom de l'apprenant" },
      { name: 'taskLabel', required: true, description: "Intitulé de l'exercice soumis" },
      { name: 'reviewLink', required: true, description: "Lien vers l'espace de revue formateur" },
    ],
  },
  {
    name: 'submission_validated',
    label: 'Soumission validée (apprenant)',
    description: "Envoyé à l'apprenant quand sa soumission est validée par un formateur.",
    protected: true,
    variables: [
      { name: 'name', required: true, description: "Nom de l'apprenant" },
      { name: 'taskLabel', required: true, description: "Intitulé de l'exercice revu" },
      { name: 'submissionsLink', required: true, description: 'Lien vers « Mes soumissions »' },
    ],
  },
  {
    name: 'submission_changes_requested',
    label: 'Corrections demandées (apprenant)',
    description: "Envoyé à l'apprenant quand des corrections sont demandées sur sa soumission.",
    protected: true,
    variables: [
      { name: 'name', required: true, description: "Nom de l'apprenant" },
      { name: 'taskLabel', required: true, description: "Intitulé de l'exercice revu" },
      { name: 'submissionsLink', required: true, description: 'Lien vers « Mes soumissions »' },
    ],
  },
];

export function findTemplateType(name: string): TemplateTypeDefinition | undefined {
  return TEMPLATE_TYPES.find((t) => t.name === name);
}

/** Variables effectivement substituables, alignées sur MustacheTemplateEngine.render. */
const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

export function extractVariables(source: string): Set<string> {
  const found = new Set<string>();
  for (const match of source.matchAll(VARIABLE_PATTERN)) {
    found.add(match[1]);
  }
  return found;
}
