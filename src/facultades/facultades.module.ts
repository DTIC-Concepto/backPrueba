import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FacultadesService } from './facultades.service';
import { FacultadesController } from './facultades.controller';
import { FacultadModel } from './models/facultad.model';
import { UsuarioModel } from '../usuarios/models/usuario.model';
import { CarrerasModule } from '../carreras/carreras.module';

@Module({
  imports: [
    SequelizeModule.forFeature([FacultadModel, UsuarioModel]),
    forwardRef(() => CarrerasModule),
  ],
  controllers: [FacultadesController],
  providers: [FacultadesService],
  exports: [FacultadesService, SequelizeModule],
})
export class FacultadesModule {}