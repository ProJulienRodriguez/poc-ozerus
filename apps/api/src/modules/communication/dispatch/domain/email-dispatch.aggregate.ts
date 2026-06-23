/* Agrégat EmailDispatch : enregistrement immuable d'une tentative d'envoi
   (SENT avec messageId, ou FAILED avec l'erreur). Append-only : pas de mutation
   après création, juste deux fabriques. */
import { EmailDispatchId } from './email-dispatch-id.value-object';

export type EmailDispatchStatus = 'SENT' | 'FAILED';

export interface RecordSentProps {
  templateName: string;
  templateVersion: number;
  locale: string;
  to: string;
  messageId: string;
  dispatchedAt: Date;
}

export interface RecordFailedProps {
  templateName: string;
  templateVersion: number;
  locale: string;
  to: string;
  error: string;
  attemptedAt: Date;
}

export interface EmailDispatchSnapshot {
  id: string;
  templateName: string;
  templateVersion: number;
  locale: string;
  to: string;
  messageId: string | null;
  status: EmailDispatchStatus;
  error: string | null;
  correlationId: string | null;
  dispatchedAt: Date;
}

export class EmailDispatch {
  private _templateName!: string;
  private _templateVersion!: number;
  private _locale!: string;
  private _to!: string;
  private _messageId: string | null = null;
  private _status!: EmailDispatchStatus;
  private _error: string | null = null;
  private _correlationId: string | null = null;
  private _dispatchedAt!: Date;

  private constructor(public readonly id: EmailDispatchId) {}

  static recordSent(props: RecordSentProps): EmailDispatch {
    const aggregate = new EmailDispatch(EmailDispatchId.createNew());
    aggregate._templateName = props.templateName;
    aggregate._templateVersion = props.templateVersion;
    aggregate._locale = props.locale;
    aggregate._to = props.to;
    aggregate._messageId = props.messageId;
    aggregate._status = 'SENT';
    aggregate._error = null;
    aggregate._dispatchedAt = props.dispatchedAt;
    return aggregate;
  }

  static recordFailed(props: RecordFailedProps): EmailDispatch {
    const aggregate = new EmailDispatch(EmailDispatchId.createNew());
    aggregate._templateName = props.templateName;
    aggregate._templateVersion = props.templateVersion;
    aggregate._locale = props.locale;
    aggregate._to = props.to;
    aggregate._messageId = null;
    aggregate._status = 'FAILED';
    aggregate._error = props.error;
    aggregate._dispatchedAt = props.attemptedAt;
    return aggregate;
  }

  snapshot(): EmailDispatchSnapshot {
    return {
      id: this.id.value,
      templateName: this._templateName,
      templateVersion: this._templateVersion,
      locale: this._locale,
      to: this._to,
      messageId: this._messageId,
      status: this._status,
      error: this._error,
      correlationId: this._correlationId,
      dispatchedAt: this._dispatchedAt,
    };
  }
}
