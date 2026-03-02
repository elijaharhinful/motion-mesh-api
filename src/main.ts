import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for Stripe webhook signature verification
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
  const apiPrefix = configService.get<string>('API_PREFIX') ?? 'api/v1';

  // ─── Global Configuration ─────────────────────────────────────────────────
  app.setGlobalPrefix(apiPrefix);
// eslint-disable-next-line @typescript-eslint/no-require-imports
  app.use(require('cookie-parser')());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ─── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL'),
    credentials: true,
  });

  // ─── Swagger ──────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MotionMesh API')
    .setDescription('AI-powered dance video marketplace API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth')
    .addTag('Users')
    .addTag('Creators')
    .addTag('Videos')
    .addTag('Payments')
    .addTag('AI Generation')
    .addTag('Webhooks')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  console.log(`MotionMesh API running on http://localhost:${port}/${apiPrefix}`);
  console.log(`Swagger UI available at http://localhost:${port}/api/docs`);
}

void bootstrap();
