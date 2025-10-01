import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Módulos de la aplicación
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { FacultadesModule } from './facultades/facultades.module';
import { CarrerasModule } from './carreras/carreras.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditoriaModule } from './auditoria/auditoria.module';

// Modelos
import { UsuarioModel } from './usuarios/models/usuario.model';
import { FacultadModel } from './facultades/models/facultad.model';
import { CarreraModel } from './carreras/models/carrera.model';
import { AuditoriaEventoModel } from './auditoria/models/auditoria-evento.model';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'postgres',
      database: process.env.DB_NAME || 'poliacredita_db',
      models: [UsuarioModel, FacultadModel, CarreraModel, AuditoriaEventoModel],
      autoLoadModels: true,
      sync: { alter: true }, // Modifica tablas existentes para que coincidan con los modelos
    }),
    // Módulos de funcionalidad
    UsuariosModule,
    AuthModule,
    FacultadesModule,
    CarrerasModule,
    DashboardModule,
    AuditoriaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
