/* Exceptions du domaine communication, mappées sur des exceptions HTTP NestJS
   (même approche que identity/domain/exceptions). */
import { BadGatewayException, BadRequestException, NotFoundException } from '@nestjs/common';

/** Violation d'une règle métier (ex: modifier/publier un template non-DRAFT). */
export class BusinessRuleViolationException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}

export class TemplateNotFoundException extends NotFoundException {
  constructor(lookup: { name?: string; locale?: string; version?: number; id?: string }) {
    const key = lookup.id
      ? `id=${lookup.id}`
      : `name=${lookup.name}, locale=${lookup.locale}${
          lookup.version !== undefined ? `, version=${lookup.version}` : ''
        }`;
    super(`Template introuvable (${key})`);
  }
}

export class UnsupportedEngineVersionException extends BadRequestException {
  constructor(engineVersion: number, supported: number[]) {
    super(
      `Engine version ${engineVersion} non supportée (versions connues : ${supported.join(', ')})`,
    );
  }
}

/** Échec d'envoi SMTP (mappé en 502 — la cause est en aval). */
export class EmailDeliveryFailedException extends BadGatewayException {
  constructor(public readonly reason: string) {
    super(`Email delivery failed: ${reason}`);
  }
}
