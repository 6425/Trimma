import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS only when explicitly running the gateway in dev/staging.
  const corsOrigin = process.env.TRIMMA_API_GATEWAY_CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Run Backend on Port 4000 to avoid conflicting with Next.js on 3000
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Trimma API Gateway is running on: http://localhost:${port}`);
}
bootstrap().catch(console.error);
