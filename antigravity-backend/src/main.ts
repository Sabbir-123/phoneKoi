import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security HTTP Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Managed by Next.js frontend
    }),
  );

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  // Strict Origin CORS
  const configuredOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://phone-koi-git-main-sabbir123s-projects.vercel.app',
    'https://phone-koi.vercel.app',
    'https://phonekoi.com',
    'https://www.phonekoi.com',
    process.env.FRONTEND_URL,
    ...configuredOrigins,
  ].filter(Boolean) as string[];

  // Dedicated regex pattern for legitimate Sabbir-123 project Vercel deploy previews only
  const trustedDeployPattern = /^https:\/\/phone-koi-[a-z0-9-]+-sabbir123s-projects\.vercel\.app$/;

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) || trustedDeployPattern.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },

    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`PhoneKoi Backend running securely on port ${port}`);
}
bootstrap();
