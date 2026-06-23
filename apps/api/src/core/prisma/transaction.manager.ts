import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

/** Exécute plusieurs écritures dans une seule transaction Prisma (unit of work).
   Les repos acceptent un `Prisma.TransactionClient` optionnel : passé → écriture
   dans la transaction ; absent → écriture autonome via le client de base. */
@Injectable()
export class TransactionManager {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }
}
