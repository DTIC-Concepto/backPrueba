import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar validación global
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Poliacredita - API RAA')
    .setDescription('API para la gestión de Resultados de Aprendizaje de Asignatura (RAA) del sistema Poliacredita')
    .setVersion('1.0')
    .addTag('RAA', 'Resultados de Aprendizaje de Asignatura')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(process.env.PORT ?? 3000);
  
  console.log(`🚀 Aplicación ejecutándose en: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📚 Documentación Swagger en: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
bootstrap();
