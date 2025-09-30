import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AuditoriaEventoModel } from '../auditoria/models/auditoria-evento.model';
import { UsuarioModel } from '../usuarios/models/usuario.model';

@Module({
  imports: [
    SequelizeModule.forFeature([AuditoriaEventoModel, UsuarioModel]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}