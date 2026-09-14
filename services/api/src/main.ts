import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // SECURITY / CORRECTNESS: fail fast and loudly if required secrets are
  // missing, rather than letting individual modules fall back to unsafe
  // defaults later (see jwt.strategy.ts / auth.module.ts for the same
  // check at the point those secrets are actually used).
  const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    Logger.error(
      `Missing required environment variables: ${missing.join(', ')}. Refusing to start.`,
      'Bootstrap',
    );
    process.exit(1);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://literate-xylophone-5vvpwwj6w7j6hvg6w-3000.app.github.dev',
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  // Required for correct rate limiting / client-IP detection behind a load
  // balancer or reverse proxy — without this, ThrottlerGuard sees the
  // proxy's IP for every request instead of the real client's, and every
  // user effectively shares one rate-limit bucket.
  app.set('trust proxy', 1);

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`[SEEDS API] Service running on port ${port}`);
}
bootstrap();
