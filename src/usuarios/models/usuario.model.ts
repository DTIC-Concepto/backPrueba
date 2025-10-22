import {
  Table,
  Column,
  Model,
  DataType,
  BeforeCreate,
  BeforeUpdate,
  Index,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import * as bcrypt from 'bcrypt';
import { RolEnum } from '../../common/enums/rol.enum';
import { FacultadModel } from '../../facultades/models/facultad.model';
import { UsuarioRolModel } from '../../common/models/usuario-rol.model';

@Table({
  tableName: 'usuarios',
  timestamps: true,
})
export class UsuarioModel extends Model<UsuarioModel> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare nombres: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare apellidos: string;

  @Index({
    unique: true,
    name: 'usuarios_cedula_unique',
  })
  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    unique: true,
  })
  declare cedula: string;

  @Index({
    unique: true,
    name: 'usuarios_correo_unique',
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  })
  declare correo: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare contrasena: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'URL o path de la foto de perfil del usuario',
  })
  declare foto: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(RolEnum)),
    allowNull: false,
  })
  declare rol: RolEnum;

  @ForeignKey(() => FacultadModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: true, // Puede ser null si el usuario no está asignado a una facultad específica
    comment: 'ID de la facultad a la que pertenece como decano/subdecano/jefe de departamento',
  })
  declare facultadId: number | null;

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
  @BelongsTo(() => FacultadModel, { foreignKey: 'facultadId', as: 'facultad' })
  facultad: FacultadModel;

  // Relación many-to-many con roles
  @HasMany(() => UsuarioRolModel, { foreignKey: 'usuarioId', as: 'usuarioRoles' })
  usuarioRoles: UsuarioRolModel[];

  // Nota: La relación con CarreraModel se define desde el lado de Carrera para evitar dependencias circulares

  // Hook para encriptar contraseña antes de crear
  @BeforeCreate
  static async hashPasswordOnCreate(instance: UsuarioModel) {
    console.log('🔐 BeforeCreate hook ejecutándose...');
    if (instance.contrasena) {
      console.log('🔐 Encriptando contraseña...');
      const salt = await bcrypt.genSalt(12);
      instance.contrasena = await bcrypt.hash(instance.contrasena, salt);
      console.log('✅ Contraseña encriptada');
    } else {
      console.log('❌ No hay contraseña para encriptar');
    }
  }

  // Hook para encriptar contraseña antes de actualizar
  @BeforeUpdate
  static async hashPasswordOnUpdate(instance: UsuarioModel) {
    console.log('🔐 BeforeUpdate hook ejecutándose...');
    if (instance.changed('contrasena')) {
      console.log('🔐 Encriptando contraseña actualizada...');
      const salt = await bcrypt.genSalt(12);
      instance.contrasena = await bcrypt.hash(instance.contrasena, salt);
      console.log('✅ Contraseña actualizada y encriptada');
    }
  }

  // Método para validar contraseña
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.contrasena);
  }

  // Método para obtener datos del usuario sin contraseña
  toJSON() {
    const values = Object.assign({}, this.get()) as any;
    delete values.contrasena;
    return values;
  }

  // Métodos helper para múltiples roles
  /**
   * Obtiene todos los roles activos del usuario
   */
  async getRoles(): Promise<RolEnum[]> {
    if (this.usuarioRoles) {
      return this.usuarioRoles
        .filter(ur => ur.activo)
        .map(ur => ur.rol);
    }
    
    // Si no están cargadas las relaciones, incluir el rol principal
    return this.rol ? [this.rol] : [];
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  async hasRole(role: RolEnum): Promise<boolean> {
    const roles = await this.getRoles();
    return roles.includes(role);
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   */
  async hasAnyRole(roles: RolEnum[]): Promise<boolean> {
    const userRoles = await this.getRoles();
    return roles.some(role => userRoles.includes(role));
  }

  /**
   * Obtiene el rol principal (compatibilidad con código existente)
   */
  getPrimaryRole(): RolEnum {
    return this.rol;
  }
}