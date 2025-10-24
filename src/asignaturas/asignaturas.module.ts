import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AsignaturasService } from './asignaturas.service';
import { AsignaturasController } from './asignaturas.controller';
import { AsignaturaModel } from './models/asignatura.model';
import { CarreraModel } from '../carreras/models/carrera.model';
import { CarreraAsignaturaModel } from './models/carrera-asignatura.model';
import { CarrerasModule } from '../carreras/carreras.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      AsignaturaModel,
      CarreraModel,
      CarreraAsignaturaModel,
    ]),
    forwardRef(() => CarrerasModule),
  ],
  controllers: [AsignaturasController],
  providers: [AsignaturasService],
  exports: [AsignaturasService, SequelizeModule],
})
export class AsignaturasModule {}
