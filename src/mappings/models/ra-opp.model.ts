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
  Index,
} from 'sequelize-typescript';
import { ResultadoAprendizajeModel } from '../../resultados-aprendizaje/models/resultado-aprendizaje.model';
import { OppModel } from '../../opp/models/opp.model';

export interface RaOppAttributes {
  id: number;
  resultadoAprendizajeId: number;
  oppId: number;
  justificacion?: string;
  estadoActivo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RaOppCreationAttributes {
  resultadoAprendizajeId: number;
  oppId: number;
  justificacion?: string;
  estadoActivo?: boolean;
}

@Table({
  tableName: 'ra_opp',
  timestamps: true,
  indexes: [
    {
      name: 'ra_opp_unique',
      unique: true,
      fields: ['resultadoAprendizajeId', 'oppId'],
    },
    {
      name: 'idx_ra_opp_resultado_aprendizaje',
      fields: ['resultadoAprendizajeId'],
    },
    {
      name: 'idx_ra_opp_opp',
      fields: ['oppId'],
    },
  ],
})
export class RaOppModel extends Model<RaOppAttributes, RaOppCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare id: number;

  @ForeignKey(() => ResultadoAprendizajeModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare resultadoAprendizajeId: number;

  @ForeignKey(() => OppModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare oppId: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Justificación de la relación entre el RA y el OPP',
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
  @BelongsTo(() => ResultadoAprendizajeModel)
  declare resultadoAprendizaje: ResultadoAprendizajeModel;

  @BelongsTo(() => OppModel)
  declare opp: OppModel;
}