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
  tableName: 'facultades',
  timestamps: true,
})
export class FacultadModel extends Model<FacultadModel> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare nombre: string;

  @Index({
    unique: true,
    name: 'facultades_codigo_unique',
  })
  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    unique: true,
  })
  declare codigo: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare descripcion: string;

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
}