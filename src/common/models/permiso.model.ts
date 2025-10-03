import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  CreatedAt,
  UpdatedAt,
  HasMany,
} from 'sequelize-typescript';
import { RolPermisoModel } from './rol-permiso.model';

@Table({
  tableName: 'permisos',
  timestamps: true,
  underscored: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      unique: true,
      fields: ['codigo']
    }
  ]
})
export class PermisoModel extends Model<PermisoModel> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(100),
    comment: 'Código único del permiso (ej: manage_users, create_faculties)',
  })
  declare codigo: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(255),
    comment: 'Nombre descriptivo del permiso',
  })
  declare nombre: string;

  @AllowNull(true)
  @Column({
    type: DataType.TEXT,
    comment: 'Descripción detallada del permiso y su propósito',
  })
  declare descripcion: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(100),
    comment: 'Categoría funcional del permiso (ej: Gestión de Usuarios, Dashboards)',
  })
  declare categoria: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(100),
    comment: 'Módulo o área del sistema al que pertenece',
  })
  declare modulo: string;

  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    comment: 'Indica si el permiso está activo y disponible para asignación',
  })
  declare activo: boolean;

  @AllowNull(true)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    comment: 'Nivel de riesgo del permiso (0=bajo, 5=alto) para auditoría',
    field: 'nivel_riesgo', // Mapear al campo snake_case en BD
  })
  declare nivelRiesgo: number;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    comment: 'Fecha de creación del permiso',
  })
  declare createdAt: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    comment: 'Fecha de última actualización del permiso',
  })
  declare updatedAt: Date;

  // Relaciones
  @HasMany(() => RolPermisoModel)
  rolPermisos: RolPermisoModel[];

  // Métodos de instancia
  isActive(): boolean {
    return this.activo;
  }

  isHighRisk(): boolean {
    return this.nivelRiesgo >= 4;
  }
}