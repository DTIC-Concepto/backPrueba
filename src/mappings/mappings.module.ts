import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MappingsController, ProgramsController } from './mappings.controller';
import { MappingsService } from './mappings.service';
import { RaOppModel } from './models/ra-opp.model';
import { RaEuraceModel } from './models/ra-eurace.model';
import { ResultadoAprendizajeModel } from '../resultados-aprendizaje/models/resultado-aprendizaje.model';
import { OppModel } from '../opp/models/opp.model';
import { EurAceModel } from '../eur-ace/models/eur-ace.model';
import { CarreraModel } from '../carreras/models/carrera.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      RaOppModel,
      RaEuraceModel,
      ResultadoAprendizajeModel,
      OppModel,
      EurAceModel,
      CarreraModel,
    ]),
  ],
  controllers: [MappingsController, ProgramsController],
  providers: [MappingsService],
  exports: [MappingsService],
})
export class MappingsModule {}