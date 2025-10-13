import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  BelongsTo,
  ForeignKey,
  Index,
} from 'sequelize-typescript';
import { CarreraModel } from '../../carreras/models/carrera.model';

export enum TipoRA {
  GENERAL = 'GENERAL',
  ESPECIFICO = 'ESPECIFICO',
}

@Table({
  tableName: 'resultados_aprendizaje',
  timestamps: true,
  indexes: [
    {
      name: 'ra_codigo_tipo_carrera_unique',
      unique: true,
      fields: ['codigo', 'tipo', 'carreraId'],
    },
  ],
})
export class ResultadoAprendizajeModel extends Model<ResultadoAprendizajeModel> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare codigo: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare descripcion: string;

  @Column({
    type: DataType.ENUM,
    values: Object.values(TipoRA),
    allowNull: false,
  })
  declare tipo: TipoRA;

  @ForeignKey(() => CarreraModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare carreraId: number;

  @BelongsTo(() => CarreraModel)
  declare carrera: CarreraModel;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}