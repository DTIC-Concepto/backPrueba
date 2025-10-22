import { PartialType } from '@nestjs/swagger';
import { CreateAsignaturaDto } from './create-asignatura.dto';

export class UpdateAsignaturaDto extends PartialType(CreateAsignaturaDto) {}
