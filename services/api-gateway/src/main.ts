import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function isGatewayEnabled(): boolean {
  return process.env.TRIMMA_API_GATEWAY_ENABLED === 'true';
}

async function bootstrap() {
  if (!isGatewayEnabled()) {
    console.warn(
      '[Trimma API Gateway] DISABLED — set TRIMMA_API_GATEWAY_ENABLED=true for local dev only.',
    );
    console.warn('[Trimma API Gateway] All HTTP requests will return 503 until enabled.');
  }

  const app = await NestFactory.create(AppModule);

  if (isGatewayEnabled()) {
    const corsOrigin =
      process.env.TRIMMA_API_GATEWAY_CORS_ORIGIN || 'http://localhost:3000';
    app.enableCors({
      origin: corsOrigin,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });
    console.log(`[Trimma API Gateway] CORS origin: ${corsOrigin}`);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`[Trimma API Gateway] Listening on http://localhost:${port}`);
}

bootstrap().catch(console.error);
