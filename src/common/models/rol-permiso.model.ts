import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { PermisoModel } from './permiso.model';
import { RolEnum } from '../enums/rol.enum';

@Table({
  tableName: 'rol_permisos',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['rol', 'permiso_id'],
      name: 'unique_rol_permiso',
    },
    {
      fields: ['rol'],
      name: 'idx_rol_permisos_rol',
    },
    {
      fields: ['permiso_id'],
      name: 'idx_rol_permisos_permiso',
    },
    {
      fields: ['activo'],
      name: 'idx_rol_permisos_activo',
    },
  ],
})
export class RolPermisoModel extends Model<RolPermisoModel> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM(...Object.values(RolEnum)),
    comment: 'Rol al que se asigna el permiso',
  })
  declare rol: RolEnum;

  @ForeignKey(() => PermisoModel)
  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    comment: 'ID del permiso asignado al rol',
  })
  declare permiso_id: number;

  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    comment: 'Indica si la asignación está activa',
  })
  declare activo: boolean;

  @AllowNull(true)
  @Column({
    type: DataType.TEXT,
    comment: 'Observaciones sobre la asignación del permiso al rol',
  })
  declare observaciones: string;

  @AllowNull(true)
  @Column({
    type: DataType.INTEGER,
    comment: 'ID del usuario que realizó la asignación',
  })
  declare asignado_por: number;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    comment: 'Fecha de asignación del permiso al rol',
    field: 'createdAt', // Mapear explícitamente
  })
  declare createdAt: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    comment: 'Fecha de última actualización de la asignación',
    field: 'updatedAt', // Mapear explícitamente
  })
  declare updatedAt: Date;

  // Relaciones
  @BelongsTo(() => PermisoModel)
  permiso: PermisoModel;

  // Métodos de instancia
  isActive(): boolean {
    return this.activo;
  }

  deactivate(): void {
    this.activo = false;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.activo = true;
    this.updatedAt = new Date();
  }
}