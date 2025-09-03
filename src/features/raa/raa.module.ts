import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RaaController } from './controllers/raa.controller';
import { RaaService } from './services/raa.service';
import { RaaModel } from './models/raa.model';

@Module({
  imports: [
    SequelizeModule.forFeature([RaaModel]),
  ],
  controllers: [RaaController],
  providers: [RaaService],
  exports: [RaaService, SequelizeModule],
})
export class RaaModule {}
