import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { CarreraAsignaturaModel } from '../../asignaturas/models/carrera-asignatura.model';
import { TipoRaaEnum } from '../../common/enums/tipo-raa.enum';

@Table({
  tableName: 'raa',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['codigo', 'carreraAsignaturaId'],
      name: 'raa_codigo_carrera_asignatura_unique',
    },
  ],
})
export class RaaModel extends Model<RaaModel> {
  @ApiProperty({
    description: 'ID único del RAA',
    example: 1,
    type: 'integer',
  })
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ApiProperty({
    description: 'Código del RAA (único por carrera-asignatura)',
    example: '1.1',
    maxLength: 50,
  })
  @AllowNull(false)
  @Column({
    type: DataType.STRING(50),
    validate: {
      notEmpty: true,
      len: [1, 50],
    },
  })
  declare codigo: string;

  @ApiProperty({
    description: 'Tipo de RAA',
    enum: TipoRaaEnum,
    example: TipoRaaEnum.CONOCIMIENTOS,
  })
  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(TipoRaaEnum)),
  })
  declare tipo: TipoRaaEnum;

  @ApiProperty({
    description: 'Descripción del resultado de aprendizaje',
    example: 'El estudiante será capaz de identificar los conceptos fundamentales de ingeniería de software',
  })
  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    validate: {
      notEmpty: true,
      len: [10, 5000],
    },
  })
  declare descripcion: string;

  @ApiProperty({
    description: 'ID de la relación carrera-asignatura a la que pertenece el RAA',
    example: 1,
    type: 'integer',
  })
  @ForeignKey(() => CarreraAsignaturaModel)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare carreraAsignaturaId: number;

  @ApiProperty({
    description: 'Estado activo del RAA',
    example: true,
  })
  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare estadoActivo: boolean;

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

  // Relaciones
  @BelongsTo(() => CarreraAsignaturaModel, {
    foreignKey: 'carreraAsignaturaId',
    as: 'carreraAsignatura',
  })
  carreraAsignatura: CarreraAsignaturaModel;
}
