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
import { RolesModule } from './roles/roles.module';

// Modelos
import { UsuarioModel } from './usuarios/models/usuario.model';
import { UsuarioRolModel } from './common/models/usuario-rol.model';
import { PermisoModel } from './common/models/permiso.model';
import { RolPermisoModel } from './common/models/rol-permiso.model';
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
      models: [UsuarioModel, UsuarioRolModel, PermisoModel, RolPermisoModel, FacultadModel, CarreraModel, AuditoriaEventoModel],
      autoLoadModels: true,
      // sync: { alter: true }, // Desactivado para evitar errores con ENUMs de PostgreSQL
      logging: false // Desactivar logs SQL para mayor limpieza

    }),
    // Módulos de funcionalidad
    UsuariosModule,
    AuthModule,
    FacultadesModule,
    CarrerasModule,
    DashboardModule,
    AuditoriaModule,
    RolesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
