import {
  Table,
  Column,
  Model,
  DataType,
  Index,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'eur_ace_criteria',
  timestamps: true,
})
export class EurAceModel extends Model<EurAceModel> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Index({
    unique: true,
    name: 'eur_ace_criteria_codigo_unique',
  })
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  declare codigo: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare descripcion: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}