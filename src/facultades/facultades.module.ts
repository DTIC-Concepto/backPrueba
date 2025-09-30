import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FacultadesService } from './facultades.service';
import { FacultadesController } from './facultades.controller';
import { FacultadModel } from './models/facultad.model';

@Module({
  imports: [SequelizeModule.forFeature([FacultadModel])],
  controllers: [FacultadesController],
  providers: [FacultadesService],
  exports: [FacultadesService],
})
export class FacultadesModule {}