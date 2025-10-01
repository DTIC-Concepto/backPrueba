import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CarrerasService } from './carreras.service';
import { CarrerasController } from './carreras.controller';
import { CarreraModel } from './models/carrera.model';
import { FacultadModel } from '../facultades/models/facultad.model';
import { UsuarioModel } from '../usuarios/models/usuario.model';
import { FacultadesModule } from '../facultades/facultades.module';

@Module({
  imports: [
    SequelizeModule.forFeature([CarreraModel, FacultadModel, UsuarioModel]),
    forwardRef(() => FacultadesModule),
  ],
  controllers: [CarrerasController],
  providers: [CarrerasService],
  exports: [CarrerasService, SequelizeModule],
})
export class CarrerasModule {}