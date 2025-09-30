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
    .setTitle('Poliacredita API')
    .setDescription('Sistema de gestión académica para la Escuela Politécnica Nacional que asegura la trazabilidad completa de la formación profesional y la alineación con los estándares de acreditación EUR-ACE.\n\n## Cómo usar la autenticación:\n1. Ejecute POST /auth/login con sus credenciales\n2. Copie el `access_token` de la respuesta\n3. Haga clic en el botón "Authorize" arriba\n4. Pegue el token (sin "Bearer ") en el campo\n5. ¡Ya puede usar los endpoints protegidos!')
    .setVersion('1.0')
    .setContact('DTIC - EPN', 'https://www.epn.edu.ec', 'dtic@epn.edu.ec')
    .addTag('Health', 'Endpoints de salud del sistema')
    .addTag('Auth', 'Autenticación y autorización')
    .addTag('Usuarios', 'Gestión de usuarios del sistema')
    .addTag('Facultades', 'Gestión de facultades académicas')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Ingrese el token JWT obtenido del endpoint /auth/login',
        in: 'header',
      },
      'bearer',
    )
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
    },
    customSiteTitle: 'Poliacredita API Documentation',
    customfavIcon: 'https://www.epn.edu.ec/wp-content/uploads/2018/08/cropped-logosimbolo_epn-32x32.png',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .info .title { color: #1f2937 }
    `,
  });

  await app.listen(process.env.PORT ?? 3000);
  
  console.log(`🚀 Aplicación ejecutándose en: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📚 Documentación Swagger en: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
bootstrap();
