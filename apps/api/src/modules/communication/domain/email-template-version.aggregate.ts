/* Agrégat EmailTemplateVersion.

   Même convention que le module identity : pas d'event store, l'entité Prisma est
   la seule source de vérité (snapshot). Réhydratation depuis le snapshot, mutations
   directes gardiennes des invariants (state machine DRAFT → PUBLISHED → ARCHIVED).

   Une « version » regroupe un corps par locale. Tant qu'elle est DRAFT, ses corps
   sont modifiables ; une fois publiée, elle est figée (on crée une nouvelle version
   pour toute évolution). */
import { randomUUID } from 'crypto';
import { BusinessRuleViolationException } from './exceptions/communication.exceptions';
import { TemplateMustBeDraftToPublishRule } from './rules/template-must-be-draft-to-publish.rule';
import { TemplateMustBeDraftToUpdateRule } from './rules/template-must-be-draft-to-update.rule';
import { EmailTemplateId } from './value-objects/email-template-id.value-object';
import { TemplateBody } from './value-objects/template-body.value-object';
import { TemplateLocale } from './value-objects/template-locale.value-object';
import { TemplateName } from './value-objects/template-name.value-object';
import { TemplateStatus } from './value-objects/template-status.value-object';
import { TemplateSubject } from './value-objects/template-subject.value-object';
import { TemplateVariables } from './value-objects/template-variables.value-object';

export interface VersionBody {
  id: string;
  locale: TemplateLocale;
  subject: TemplateSubject;
  body: TemplateBody;
  variables: TemplateVariables;
  engineVersion: number;
  compiledHtml: string | null;
}

export interface BodyInput {
  locale: string;
  subject: string;
  bodyMjml: string;
  bodyState?: Record<string, unknown> | null;
  variables?: string[];
  engineVersion?: number;
}

export interface BodySnapshot {
  id: string;
  locale: string;
  subject: string;
  bodyMjml: string;
  bodyState: Record<string, unknown> | null;
  variables: string[];
  engineVersion: number;
  compiledHtml: string | null;
}

export interface EmailTemplateVersionSnapshot {
  id: string;
  name: string;
  version: number;
  status: string;
  publishedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  bodies: BodySnapshot[];
}

export interface CreateDraftProps {
  name: string;
  version: number;
  bodies: BodyInput[];
  id?: EmailTemplateId;
}

function toBodyVO(input: BodyInput, id: string): VersionBody {
  return {
    id,
    locale: new TemplateLocale({ value: input.locale }),
    subject: new TemplateSubject({ value: input.subject }),
    body: new TemplateBody({ mjml: input.bodyMjml, state: input.bodyState ?? null }),
    variables: new TemplateVariables({ values: input.variables ?? [] }),
    engineVersion: input.engineVersion ?? 1,
    compiledHtml: null,
  };
}

export class EmailTemplateVersion {
  private _name!: TemplateName;
  private _templateVersion!: number;
  private _status!: TemplateStatus;
  private _publishedAt: Date | null = null;
  private _archivedAt: Date | null = null;
  private _createdAt!: Date;
  private _updatedAt!: Date;
  private readonly _bodies = new Map<string, VersionBody>();

  private constructor(public readonly id: EmailTemplateId) {}

  static createDraft(props: CreateDraftProps): EmailTemplateVersion {
    if (props.bodies.length === 0) {
      throw new Error('Une version de template doit avoir au moins un corps');
    }
    const aggregate = new EmailTemplateVersion(props.id ?? EmailTemplateId.createNew());
    const now = new Date();
    aggregate._name = new TemplateName({ value: props.name });
    aggregate._templateVersion = props.version;
    aggregate._status = TemplateStatus.draft();
    aggregate._publishedAt = null;
    aggregate._archivedAt = null;
    aggregate._createdAt = now;
    aggregate._updatedAt = now;
    for (const input of props.bodies) {
      const vo = toBodyVO(input, randomUUID());
      aggregate._bodies.set(vo.locale.value, vo);
    }
    return aggregate;
  }

  static rehydrate(snapshot: EmailTemplateVersionSnapshot): EmailTemplateVersion {
    const aggregate = new EmailTemplateVersion(EmailTemplateId.create(snapshot.id));
    aggregate._name = new TemplateName({ value: snapshot.name });
    aggregate._templateVersion = snapshot.version;
    aggregate._status = TemplateStatus.fromString(snapshot.status);
    aggregate._publishedAt = snapshot.publishedAt;
    aggregate._archivedAt = snapshot.archivedAt;
    aggregate._createdAt = snapshot.createdAt;
    aggregate._updatedAt = snapshot.updatedAt;
    for (const b of snapshot.bodies) {
      aggregate._bodies.set(b.locale, {
        id: b.id,
        locale: new TemplateLocale({ value: b.locale }),
        subject: new TemplateSubject({ value: b.subject }),
        body: new TemplateBody({ mjml: b.bodyMjml, state: b.bodyState }),
        variables: new TemplateVariables({ values: b.variables }),
        engineVersion: b.engineVersion,
        compiledHtml: b.compiledHtml,
      });
    }
    return aggregate;
  }

  // --- Commandes (gardiennes des invariants) ---

  updateBody(locale: string, props: Omit<BodyInput, 'locale' | 'engineVersion'>): void {
    this.assertDraft(new TemplateMustBeDraftToUpdateRule(this._status.value));
    const current = this._bodies.get(locale);
    if (!current) {
      throw new Error(`Aucun corps en "${locale}" pour cette version`);
    }
    this._bodies.set(locale, {
      ...current,
      subject: new TemplateSubject({ value: props.subject }),
      body: new TemplateBody({ mjml: props.bodyMjml, state: props.bodyState ?? null }),
      variables: new TemplateVariables({ values: props.variables ?? current.variables.values }),
      compiledHtml: null,
    });
    this._updatedAt = new Date();
  }

  /**
   * Met à jour les valeurs d'exemple par variable (métadonnées d'aperçu).
   * Pas soumis à la règle DRAFT : les samples n'altèrent jamais l'email envoyé,
   * ils n'alimentent que l'aperçu admin.
   */
  setSamples(locale: string, samples: Record<string, string>): void {
    const current = this._bodies.get(locale);
    if (!current) {
      throw new Error(`Aucun corps en "${locale}" pour cette version`);
    }
    const state = {
      ...((current.body.state as Record<string, unknown> | null) ?? {}),
      samples,
    };
    this._bodies.set(locale, {
      ...current,
      body: new TemplateBody({ mjml: current.body.mjml, state }),
    });
    this._updatedAt = new Date();
  }

  addLocale(input: BodyInput): void {
    this.assertDraft(new TemplateMustBeDraftToUpdateRule(this._status.value));
    if (this._bodies.has(input.locale)) {
      throw new Error(`Un corps en "${input.locale}" existe déjà pour cette version`);
    }
    const vo = toBodyVO(input, randomUUID());
    this._bodies.set(vo.locale.value, vo);
    this._updatedAt = new Date();
  }

  publish(compiledHtmlByLocale: Map<string, string>): void {
    this.assertDraft(new TemplateMustBeDraftToPublishRule(this._status.value));
    for (const [locale, html] of compiledHtmlByLocale) {
      const existing = this._bodies.get(locale);
      if (existing) {
        existing.compiledHtml = html;
      }
    }
    const now = new Date();
    this._status = TemplateStatus.published();
    this._publishedAt = now;
    this._updatedAt = now;
  }

  archive(): void {
    if (this._status.isArchived()) {
      return;
    }
    const now = new Date();
    this._status = TemplateStatus.archived();
    this._archivedAt = now;
    this._updatedAt = now;
  }

  private assertDraft(rule: { isBroken(): boolean; message: string }): void {
    if (rule.isBroken()) {
      throw new BusinessRuleViolationException(rule.message);
    }
  }

  // --- Lecture ---

  get name(): TemplateName {
    return this._name;
  }

  get templateVersion(): number {
    return this._templateVersion;
  }

  get status(): TemplateStatus {
    return this._status;
  }

  get locales(): string[] {
    return [...this._bodies.keys()];
  }

  getBody(locale: string): VersionBody | undefined {
    return this._bodies.get(locale);
  }

  get bodies(): VersionBody[] {
    return [...this._bodies.values()];
  }

  snapshot(): EmailTemplateVersionSnapshot {
    return {
      id: this.id.value,
      name: this._name.value,
      version: this._templateVersion,
      status: this._status.value,
      publishedAt: this._publishedAt,
      archivedAt: this._archivedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      bodies: this.bodies.map((b) => ({
        id: b.id,
        locale: b.locale.value,
        subject: b.subject.value,
        bodyMjml: b.body.mjml,
        bodyState: b.body.state,
        variables: b.variables.values,
        engineVersion: b.engineVersion,
        compiledHtml: b.compiledHtml,
      })),
    };
  }
}
