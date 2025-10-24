import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { RaaModel } from '../../raa/models/raa.model';
import { ResultadoAprendizajeModel } from '../../resultados-aprendizaje/models/resultado-aprendizaje.model';
import { NivelAporteEnum } from '../../common/enums/nivel-aporte.enum';

export interface RaaRaAttributes {
  id: number;
  raaId: number;
  resultadoAprendizajeId: number;
  nivelAporte: NivelAporteEnum;
  justificacion?: string;
  estadoActivo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RaaRaCreationAttributes {
  raaId: number;
  resultadoAprendizajeId: number;
  nivelAporte: NivelAporteEnum;
  justificacion?: string;
  estadoActivo?: boolean;
}

@Table({
  tableName: 'raa_ra',
  timestamps: true,
  indexes: [
    {
      name: 'raa_ra_unique',
      unique: true,
      fields: ['raaId', 'resultadoAprendizajeId'],
    },
    {
      name: 'idx_raa_ra_raa',
      fields: ['raaId'],
    },
    {
      name: 'idx_raa_ra_resultado_aprendizaje',
      fields: ['resultadoAprendizajeId'],
    },
  ],
})
export class RaaRaModel extends Model<RaaRaAttributes, RaaRaCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare id: number;

  @ForeignKey(() => RaaModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare raaId: number;

  @ForeignKey(() => ResultadoAprendizajeModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare resultadoAprendizajeId: number;

  @Column({
    type: DataType.ENUM(...Object.values(NivelAporteEnum)),
    allowNull: false,
    comment: 'Nivel de aporte del RA al RAA (Alto, Medio, Bajo)',
  })
  declare nivelAporte: NivelAporteEnum;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Justificación de la relación entre el RAA y el RA',
  })
  declare justificacion?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Estado activo de la relación',
  })
  declare estadoActivo: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Relaciones
  @BelongsTo(() => RaaModel)
  declare raa: RaaModel;

  @BelongsTo(() => ResultadoAprendizajeModel)
  declare resultadoAprendizaje: ResultadoAprendizajeModel;
}
