import {
  Table,
  Column,
  Model,
  ForeignKey,
  DataType,
  CreatedAt,
  UpdatedAt,
  BelongsTo,
} from 'sequelize-typescript';
import { UsuarioModel } from '../../usuarios/models/usuario.model';
import { CarreraModel } from '../../carreras/models/carrera.model';

@Table({
  tableName: 'usuario_carreras',
  timestamps: true,
})
export class UsuarioCarreraModel extends Model {
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

  @ForeignKey(() => CarreraModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'carrera_id',
  })
  declare carreraId: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'es_coordinador',
    comment: 'Indica si este usuario es el coordinador de la carrera',
  })
  declare esCoordinador: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'estado_activo',
  })
  declare estadoActivo: boolean;

  @BelongsTo(() => UsuarioModel, { foreignKey: 'usuarioId' })
  declare usuario: UsuarioModel;

  @BelongsTo(() => CarreraModel, { foreignKey: 'carreraId' })
  declare carrera: CarreraModel;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  declare updatedAt: Date;
}
