import { PartialType } from '@nestjs/swagger';
import { CreateRaaDto } from './create-raa.dto';

export class UpdateRaaDto extends PartialType(CreateRaaDto) {}
