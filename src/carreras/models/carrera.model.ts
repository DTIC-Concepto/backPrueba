import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Unique,
  BelongsTo,
  BelongsToMany,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
  HasMany,
} from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { FacultadModel } from '../../facultades/models/facultad.model';
import { UsuarioModel } from '../../usuarios/models/usuario.model';
import { ModalidadEnum } from '../../common/enums/modalidad.enum';
import { AsignaturaModel } from '../../asignaturas/models/asignatura.model';
import { CarreraAsignaturaModel } from '../../asignaturas/models/carrera-asignatura.model';
import { UsuarioCarreraModel } from '../../common/models/usuario-carrera.model';

@Table({
  tableName: 'carreras',
  timestamps: true,
})
export class CarreraModel extends Model<CarreraModel> {
  @ApiProperty({
    description: 'ID único de la carrera',
    example: 1,
    type: 'integer',
  })
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ApiProperty({
    description: 'Código único de la carrera',
    example: 'ING-SIS',
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
  declare codigo: string;

  @ApiProperty({
    description: 'Nombre completo de la carrera',
    example: 'Ingeniería en Sistemas Informáticos y de Computación',
    maxLength: 200,
  })
  @AllowNull(false)
  @Column({
    type: DataType.STRING(200),
    validate: {
      notEmpty: true,
      len: [5, 200],
    },
  })
  declare nombre: string;

  @ApiProperty({
    description: 'ID de la facultad a la que pertenece la carrera',
    example: 1,
    type: 'integer',
  })
  @ForeignKey(() => FacultadModel)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare facultadId: number;

  @ApiProperty({
    description: 'ID del coordinador de la carrera',
    example: 2,
    type: 'integer',
  })
  @ForeignKey(() => UsuarioModel)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare coordinadorId: number;

  @ApiProperty({
    description: 'Duración de la carrera en semestres',
    example: 10,
    type: 'integer',
  })
  @AllowNull(true) // Temporalmente permitir NULL para la migración
  @Column({
    type: DataType.INTEGER,
    defaultValue: 10, // Valor por defecto para registros existentes
    validate: {
      min: 1,
      max: 20,
    },
  })
  declare duracion: number;

  @ApiProperty({
    description: 'Modalidad de la carrera',
    enum: ModalidadEnum,
    example: ModalidadEnum.PRESENCIAL,
  })
  @AllowNull(true) // Temporalmente permitir NULL para la migración
  @Column({
    type: DataType.ENUM(...Object.values(ModalidadEnum)),
    defaultValue: ModalidadEnum.PRESENCIAL,
  })
  declare modalidad: ModalidadEnum;

  @ApiProperty({
    description: 'Estado activo de la carrera',
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
  @BelongsTo(() => FacultadModel, { foreignKey: 'facultadId', as: 'facultad' })
  facultad: FacultadModel;

  @BelongsTo(() => UsuarioModel, { foreignKey: 'coordinadorId', as: 'coordinador' })
  coordinador: UsuarioModel;

  // Relación Many-to-Many con Asignaturas
  @BelongsToMany(() => AsignaturaModel, () => CarreraAsignaturaModel)
  asignaturas: AsignaturaModel[];

  // Relación Many-to-Many con Usuarios (profesores asignados)
  @BelongsToMany(() => UsuarioModel, () => UsuarioCarreraModel)
  profesores: UsuarioModel[];

  // Relación con la tabla intermedia usuario_carreras
  @HasMany(() => UsuarioCarreraModel, { foreignKey: 'carreraId', as: 'usuarioCarreras' })
  usuarioCarreras: UsuarioCarreraModel[];
}