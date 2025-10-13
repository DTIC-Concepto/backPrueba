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
import { CarreraModel } from '../../carreras/models/carrera.model';

@Table({
  tableName: 'opp',
  timestamps: true,
  paranoid: false,
})
export class OppModel extends Model<OppModel> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
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