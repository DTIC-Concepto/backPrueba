import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Unique,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  BelongsToMany,
} from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { CarreraModel } from '../../carreras/models/carrera.model';
import { CarreraAsignaturaModel } from './carrera-asignatura.model';
import { TipoAsignaturaEnum } from '../../common/enums/tipo-asignatura.enum';
import { UnidadCurricularEnum } from '../../common/enums/unidad-curricular.enum';

@Table({
  tableName: 'asignaturas',
  timestamps: true,
  paranoid: true, // Habilita soft deletes
})
export class AsignaturaModel extends Model<AsignaturaModel> {
  @ApiProperty({
    description: 'ID único de la asignatura',
    example: 1,
    type: 'integer',
  })
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ApiProperty({
    description: 'Código único de la asignatura',
    example: 'ISWD414',
    maxLength: 20,
  })
  @AllowNull(false)
  @Unique
  @Column({
    type: DataType.STRING(20),
    validate: {
      notEmpty: true,
      len: [2, 20],
    },
  })
  codigo: string;

  @ApiProperty({
    description: 'Nombre de la asignatura',
    example: 'Ingeniería de Software y Requerimientos',
    maxLength: 200,
  })
  @AllowNull(false)
  @Column({
    type: DataType.STRING(200),
    validate: {
      notEmpty: true,
      len: [3, 200],
    },
  })
  nombre: string;

  @ApiProperty({
    description: 'Número de créditos de la asignatura',
    example: 3,
    type: 'integer',
  })
  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    validate: {
      min: 1,
      max: 10,
    },
  })
  creditos: number;

  @ApiProperty({
    description: 'Descripción de la asignatura',
    example: 'Asignatura que cubre conceptos fundamentales de ingeniería de software',
  })
  @AllowNull(true)
  @Column({
    type: DataType.TEXT,
  })
  descripcion: string;

  @ApiProperty({
    description: 'Tipo de asignatura',
    enum: TipoAsignaturaEnum,
    example: TipoAsignaturaEnum.OBLIGATORIA,
  })
  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(TipoAsignaturaEnum)),
  })
  tipoAsignatura: TipoAsignaturaEnum;

  @ApiProperty({
    description: 'Unidad curricular a la que pertenece',
    enum: UnidadCurricularEnum,
    example: UnidadCurricularEnum.UNIDAD_PROFESIONAL,
  })
  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(UnidadCurricularEnum)),
  })
  unidadCurricular: UnidadCurricularEnum;

  @ApiProperty({
    description: 'Período académico (pénsum)',
    example: 2023,
    type: 'integer',
  })
  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    validate: {
      min: 2000,
      max: 2100,
    },
  })
  pensum: number;

  @ApiProperty({
    description: 'Nivel referencial de la asignatura (semestre)',
    example: 1,
    type: 'integer',
  })
  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    validate: {
      min: 1,
      max: 20,
    },
  })
  nivelReferencial: number;

  @ApiProperty({
    description: 'Estado activo de la asignatura',
    example: true,
  })
  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  estadoActivo: boolean;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2024-01-15T10:30:00.000Z',
  })
  @CreatedAt
  declare createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del registro',
    example: '2024-01-20T15:45:00.000Z',
  })
  @UpdatedAt
  declare updatedAt: Date;

  @ApiProperty({
    description: 'Fecha de eliminación del registro (soft delete)',
    example: null,
  })
  @DeletedAt
  declare deletedAt: Date;

  // Relación Many-to-Many con Carreras
  @BelongsToMany(() => CarreraModel, () => CarreraAsignaturaModel)
  carreras: CarreraModel[];
}
