import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

/** Valide un body avec un schéma Zod, 400 avec détail sinon. */
export function parseOrBadRequest<T>(schema: z.ZodType<T>, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) {
    const msg = r.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join(' ; ');
    throw new BadRequestException(msg);
  }
  return r.data;
}
