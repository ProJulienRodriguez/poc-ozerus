import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: false,
  });

  // Derrière un reverse proxy : req.ip doit refléter le client réel
  // (X-Forwarded-For) pour que le rate-limiting soit par client.
  app.set('trust proxy', true);

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Les tokens transitent par cookies httpOnly : credentials obligatoires.
  const origins = (process.env.FRONT_ORIGIN ?? 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({ origin: origins, credentials: true });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  Logger.log(`Ozerus API listening on http://localhost:${port}/api`, 'Bootstrap');
}

void bootstrap();
