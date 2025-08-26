import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { getCorsConfig } from './config/cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS - Configuração centralizada
  app.enableCors(getCorsConfig());
  
  // Validation - Configuração mais flexível em desenvolvimento
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: process.env.NODE_ENV === 'production',
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    skipMissingProperties: false,
    skipNullProperties: false,
    skipUndefinedProperties: false,
  }));
  
  // Swagger
  const config = new DocumentBuilder()
    .setTitle('NetZap API')
    .setDescription('API do projeto NetZap migrada para NestJS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 NetZap API rodando na porta ${port}`);
  console.log(`📚 Documentação disponível em http://localhost:${port}/api`);
  console.log(`🌐 CORS configurado e ativo`);
}
bootstrap();
