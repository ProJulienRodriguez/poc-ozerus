import { Command } from '@nestjs/cqrs';

export interface EnrollMfaResult {
  otpauthUri: string;
  secret: string;
}

/** Démarre l'enrôlement MFA : génère un secret (non encore activé). */
export class EnrollMfaCommand extends Command<EnrollMfaResult> {
  constructor(public readonly accountId: string) {
    super();
  }
}
