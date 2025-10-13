import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { EurAceController } from './eur-ace.controller';
import { EurAceService } from './eur-ace.service';
import { EurAceModel } from './models/eur-ace.model';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [
    SequelizeModule.forFeature([EurAceModel]),
    AuditoriaModule,
  ],
  controllers: [EurAceController],
  providers: [EurAceService],
  exports: [EurAceService, SequelizeModule],
})
export class EurAceModule {}