import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Index,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { ResultadoAprendizajeModel } from '../../resultados-aprendizaje/models/resultado-aprendizaje.model';
import { EurAceModel } from '../../eur-ace/models/eur-ace.model';

@Table({
  tableName: 'ra_eurace',
  timestamps: true,
  indexes: [
    {
      name: 'ra_eurace_unique',
      unique: true,
      fields: ['resultadoAprendizajeId', 'eurAceId'],
    },
  ],
})
export class RaEuraceModel extends Model<RaEuraceModel> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => ResultadoAprendizajeModel)
  @Index('ra_eurace_ra_id_idx')
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare resultadoAprendizajeId: number;

  @ForeignKey(() => EurAceModel)
  @Index('ra_eurace_eurace_id_idx')
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare eurAceId: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    validate: {
      len: {
        args: [10, 1000],
        msg: 'La justificación debe tener entre 10 y 1000 caracteres',
      },
    },
  })
  declare justificacion: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare estadoActivo: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Relaciones
  @BelongsTo(() => ResultadoAprendizajeModel, 'resultadoAprendizajeId')
  declare resultadoAprendizaje: ResultadoAprendizajeModel;

  @BelongsTo(() => EurAceModel, 'eurAceId')
  declare eurAce: EurAceModel;
}