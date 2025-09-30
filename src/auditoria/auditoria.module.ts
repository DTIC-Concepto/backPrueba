import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaEventoModel } from './models/auditoria-evento.model';

@Module({
  imports: [
    SequelizeModule.forFeature([AuditoriaEventoModel]),
  ],
  providers: [AuditoriaService],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}