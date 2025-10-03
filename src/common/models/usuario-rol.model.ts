import { Table, Column, Model, ForeignKey, DataType, CreatedAt, UpdatedAt, BelongsTo } from 'sequelize-typescript';
import { UsuarioModel } from '../../usuarios/models/usuario.model';
import { RolEnum } from '../enums/rol.enum';

@Table({
  tableName: 'usuario_roles',
  timestamps: true,
})
export class UsuarioRolModel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => UsuarioModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'usuario_id',
  })
  declare usuarioId: number;

  @Column({
    type: DataType.ENUM('ADMINISTRADOR', 'DGIP', 'PROFESOR', 'DECANO', 'SUBDECANO', 'JEFE_DEPARTAMENTO', 'COORDINADOR', 'CEI'),
    allowNull: false,
  })
  declare rol: RolEnum;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  })
  declare activo: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare observaciones: string;

    @Column({ field: 'asignado_por' })
  declare asignadoPor: string;

  @BelongsTo(() => UsuarioModel, { foreignKey: 'usuarioId' })
  declare usuario: UsuarioModel;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  declare updatedAt: Date;
}