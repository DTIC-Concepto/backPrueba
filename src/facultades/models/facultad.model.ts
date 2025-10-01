import {
  Table,
  Column,
  Model,
  DataType,
  Index,
  CreatedAt,
  UpdatedAt,
  HasMany,
} from 'sequelize-typescript';
import { CarreraModel } from '../../carreras/models/carrera.model';
import { UsuarioModel } from '../../usuarios/models/usuario.model';

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

  // Relaciones
  @HasMany(() => CarreraModel, { foreignKey: 'facultadId', as: 'carreras' })
  carreras: CarreraModel[];

  // Relación con usuarios de la facultad
  @HasMany(() => UsuarioModel, { foreignKey: 'facultadId' })
  usuarios: UsuarioModel[];

  // Método helper para obtener el decano
  getDecano?(): Promise<UsuarioModel | null>;

  // Método helper para obtener el subdecano  
  getSubdecano?(): Promise<UsuarioModel | null>;

  // Método helper para obtener jefes de departamento
  getJefesDepartamento?(): Promise<UsuarioModel[]>;
}