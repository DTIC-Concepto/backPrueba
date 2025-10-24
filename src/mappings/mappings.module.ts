import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MappingsController, ProgramsController, RaaRaMappingsController } from './mappings.controller';
import { MappingsService } from './mappings.service';
import { RaOppModel } from './models/ra-opp.model';
import { RaEuraceModel } from './models/ra-eurace.model';
import { RaaRaModel } from './models/raa-ra.model';
import { ResultadoAprendizajeModel } from '../resultados-aprendizaje/models/resultado-aprendizaje.model';
import { OppModel } from '../opp/models/opp.model';
import { EurAceModel } from '../eur-ace/models/eur-ace.model';
import { CarreraModel } from '../carreras/models/carrera.model';
import { RaaModel } from '../raa/models/raa.model';
import { CarreraAsignaturaModel } from '../asignaturas/models/carrera-asignatura.model';
import { AsignaturaModel } from '../asignaturas/models/asignatura.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      RaOppModel,
      RaEuraceModel,
      RaaRaModel,
      ResultadoAprendizajeModel,
      OppModel,
      EurAceModel,
      CarreraModel,
      RaaModel,
      CarreraAsignaturaModel,
      AsignaturaModel,
    ]),
  ],
  controllers: [MappingsController, ProgramsController, RaaRaMappingsController],
  providers: [MappingsService],
  exports: [MappingsService],
})
export class MappingsModule {}