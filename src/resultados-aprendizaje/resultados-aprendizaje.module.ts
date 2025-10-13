import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ResultadosAprendizajeController } from './resultados-aprendizaje.controller';
import { ResultadosAprendizajeService } from './resultados-aprendizaje.service';
import { ResultadoAprendizajeModel } from './models/resultado-aprendizaje.model';
import { CarreraModel } from '../carreras/models/carrera.model';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [
    SequelizeModule.forFeature([ResultadoAprendizajeModel, CarreraModel]),
    AuditoriaModule,
  ],
  controllers: [ResultadosAprendizajeController],
  providers: [ResultadosAprendizajeService],
  exports: [ResultadosAprendizajeService, SequelizeModule],
})
export class ResultadosAprendizajeModule {}