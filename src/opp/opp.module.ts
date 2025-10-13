import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OppController } from './opp.controller';
import { OppService } from './opp.service';
import { OppModel } from './models/opp.model';
import { CarreraModel } from '../carreras/models/carrera.model';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [
    SequelizeModule.forFeature([OppModel, CarreraModel]),
    AuditoriaModule,
  ],
  controllers: [OppController],
  providers: [OppService],
  exports: [OppService],
})
export class OppModule {}