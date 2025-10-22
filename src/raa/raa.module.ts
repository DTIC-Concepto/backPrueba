import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RaaService } from './raa.service';
import { RaaController } from './raa.controller';
import { RaaModel } from './models/raa.model';
import { CarreraAsignaturaModel } from '../asignaturas/models/carrera-asignatura.model';
import { AsignaturaModel } from '../asignaturas/models/asignatura.model';
import { CarreraModel } from '../carreras/models/carrera.model';
import { AsignaturasModule } from '../asignaturas/asignaturas.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      RaaModel,
      CarreraAsignaturaModel,
      AsignaturaModel,
      CarreraModel,
    ]),
    forwardRef(() => AsignaturasModule),
  ],
  controllers: [RaaController],
  providers: [RaaService],
  exports: [RaaService, SequelizeModule],
})
export class RaaModule {}
