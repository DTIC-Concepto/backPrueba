import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { PermisoModel } from '../models/permiso.model';
import { RolPermisoModel } from '../models/rol-permiso.model';
import { RolEnum } from '../enums/rol.enum';

export interface CreatePermisoDto {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  modulo: string;
  activo?: boolean;
  nivelRiesgo?: number;
}

export interface UpdatePermisoDto {
  nombre?: string;
  descripcion?: string;
  categoria?: string;
  modulo?: string;
  activo?: boolean;
  nivelRiesgo?: number;
}

export interface AssignPermissionToRoleDto {
  rol: RolEnum;
  permiso_id: number;
  activo?: boolean;
  observaciones?: string;
  asignado_por?: number;
}

@Injectable()
export class PermisosService {
  constructor(
    @InjectModel(PermisoModel)
    private readonly permisoModel: typeof PermisoModel,
    @InjectModel(RolPermisoModel)
    private readonly rolPermisoModel: typeof RolPermisoModel,
  ) {}

  // CRUD de Permisos
  async createPermiso(createPermisoDto: CreatePermisoDto): Promise<PermisoModel> {
    // Verificar que el código no exista
    const existingPermiso = await this.permisoModel.findOne({
      where: { codigo: createPermisoDto.codigo }
    });

    if (existingPermiso) {
      throw new BadRequestException(`Ya existe un permiso con el código: ${createPermisoDto.codigo}`);
    }

    return this.permisoModel.create(createPermisoDto as any);
  }

  async getAllPermisos(): Promise<PermisoModel[]> {
    return this.permisoModel.findAll({
      order: [['categoria', 'ASC'], ['nombre', 'ASC']],
    });
  }

  async getPermisosActivos(): Promise<PermisoModel[]> {
    return this.permisoModel.findAll({
      where: { activo: true },
      order: [['categoria', 'ASC'], ['nombre', 'ASC']],
    });
  }

  async getPermisoById(id: number): Promise<PermisoModel> {
    const permiso = await this.permisoModel.findByPk(id);
    if (!permiso) {
      throw new NotFoundException(`Permiso con ID ${id} no encontrado`);
    }
    return permiso;
  }

  async getPermisoByCodigo(codigo: string): Promise<PermisoModel> {
    const permiso = await this.permisoModel.findOne({
      where: { codigo }
    });
    if (!permiso) {
      throw new NotFoundException(`Permiso con código ${codigo} no encontrado`);
    }
    return permiso;
  }

  async updatePermiso(id: number, updatePermisoDto: UpdatePermisoDto): Promise<PermisoModel> {
    const permiso = await this.getPermisoById(id);
    await permiso.update(updatePermisoDto);
    return permiso;
  }

  async deletePermiso(id: number): Promise<void> {
    const permiso = await this.getPermisoById(id);
    
    // Verificar si el permiso está asignado a algún rol
    const asignaciones = await this.rolPermisoModel.count({
      where: { permiso_id: id, activo: true }
    });

    if (asignaciones > 0) {
      throw new BadRequestException(
        'No se puede eliminar el permiso porque está asignado a uno o más roles. Desactive las asignaciones primero.'
      );
    }

    await permiso.destroy();
  }

  // Gestión de asignaciones Rol-Permiso
  async assignPermissionToRole(assignDto: AssignPermissionToRoleDto): Promise<RolPermisoModel> {
    const { rol, permiso_id } = assignDto;

    // Verificar que el permiso existe
    await this.getPermisoById(permiso_id);

    // Verificar si ya existe la asignación
    const existingAssignment = await this.rolPermisoModel.findOne({
      where: { rol, permiso_id }
    });

    if (existingAssignment) {
      // Si existe pero está inactiva, reactivarla
      if (!existingAssignment.activo && assignDto.activo !== false) {
        existingAssignment.activo = true;
        existingAssignment.observaciones = assignDto.observaciones || 'Reactivado';
        if (assignDto.asignado_por) {
          existingAssignment.asignado_por = assignDto.asignado_por;
        }
        await existingAssignment.save();
        return existingAssignment;
      }
      
      throw new BadRequestException(`El permiso ya está asignado al rol ${rol}`);
    }

    return this.rolPermisoModel.create(assignDto as any);
  }

  async removePermissionFromRole(rol: RolEnum, permiso_id: number): Promise<void> {
    const assignment = await this.rolPermisoModel.findOne({
      where: { rol, permiso_id }
    });

    if (!assignment) {
      throw new NotFoundException(`No se encontró la asignación del permiso ${permiso_id} al rol ${rol}`);
    }

    // Marcar como inactivo en lugar de eliminar (para auditoría)
    assignment.activo = false;
    assignment.observaciones = `Removido el ${new Date().toISOString()}`;
    await assignment.save();
  }

  async getPermissionsByRole(rol: RolEnum): Promise<PermisoModel[]> {
    return this.permisoModel.findAll({
      include: [{
        model: this.rolPermisoModel,
        where: { rol, activo: true },
        required: true,
      }],
      order: [['categoria', 'ASC'], ['nombre', 'ASC']],
    });
  }

  async getAllRolesWithPermissions(): Promise<Array<{ rol: RolEnum; permisos: PermisoModel[] }>> {
    const roles = Object.values(RolEnum);
    const result: Array<{ rol: RolEnum; permisos: PermisoModel[] }> = [];

    for (const rol of roles) {
      const permisos = await this.getPermissionsByRole(rol);
      result.push({ rol, permisos });
    }

    return result;
  }

  async getRolePermissionAssignments(rol: RolEnum): Promise<RolPermisoModel[]> {
    return this.rolPermisoModel.findAll({
      where: { rol },
      include: [{
        model: this.permisoModel,
        as: 'permiso',
      }],
      order: [['createdAt', 'DESC']],
    });
  }

  // Métodos de utilidad para consolidar permisos de múltiples roles
  async consolidatePermissionsForRoles(roles: RolEnum[]): Promise<PermisoModel[]> {
    if (roles.length === 0) return [];

    return this.permisoModel.findAll({
      include: [{
        model: this.rolPermisoModel,
        where: { 
          rol: { [Op.in]: roles },
          activo: true 
        },
        required: true,
      }],
      group: ['PermisoModel.id'],
      order: [['categoria', 'ASC'], ['nombre', 'ASC']],
    });
  }

  async getPermissionCodes(roles: RolEnum[]): Promise<string[]> {
    const permisos = await this.consolidatePermissionsForRoles(roles);
    return permisos.map(p => p.codigo);
  }

  // Métodos para estadísticas y análisis
  async getPermissionStats(): Promise<{
    totalPermisos: number;
    permisosActivos: number;
    categorias: string[];
    modulos: string[];
    asignaciones: number;
  }> {
    const totalPermisos = await this.permisoModel.count();
    const permisosActivos = await this.permisoModel.count({ where: { activo: true } });
    
    const categorias = await this.permisoModel.findAll({
      attributes: ['categoria'],
      group: ['categoria'],
      order: [['categoria', 'ASC']],
    }).then(results => results.map(r => r.categoria));

    const modulos = await this.permisoModel.findAll({
      attributes: ['modulo'],
      group: ['modulo'],
      order: [['modulo', 'ASC']],
    }).then(results => results.map(r => r.modulo));

    const asignaciones = await this.rolPermisoModel.count({ where: { activo: true } });

    return {
      totalPermisos,
      permisosActivos,
      categorias,
      modulos,
      asignaciones,
    };
  }

  // Método para inicializar permisos por defecto (migration/seeding)
  async seedDefaultPermissions(): Promise<void> {
    const defaultPermissions = [
      // Gestión de Usuarios
      { codigo: 'manage_users', nombre: 'Gestionar Usuarios', categoria: 'Gestión de Usuarios', modulo: 'usuarios', descripcion: 'Crear, actualizar y eliminar usuarios del sistema', nivelRiesgo: 4 },
      { codigo: 'create_users', nombre: 'Crear Usuarios', categoria: 'Gestión de Usuarios', modulo: 'usuarios', descripcion: 'Crear nuevos usuarios en el sistema', nivelRiesgo: 3 },
      { codigo: 'update_users', nombre: 'Actualizar Usuarios', categoria: 'Gestión de Usuarios', modulo: 'usuarios', descripcion: 'Modificar información de usuarios existentes', nivelRiesgo: 3 },
      { codigo: 'delete_users', nombre: 'Eliminar Usuarios', categoria: 'Gestión de Usuarios', modulo: 'usuarios', descripcion: 'Eliminar usuarios del sistema', nivelRiesgo: 5 },
      
      // Gestión Académica
      { codigo: 'manage_faculties', nombre: 'Gestionar Facultades', categoria: 'Gestión Académica', modulo: 'facultades', descripcion: 'Crear, actualizar y eliminar facultades', nivelRiesgo: 4 },
      { codigo: 'create_faculties', nombre: 'Crear Facultades', categoria: 'Gestión Académica', modulo: 'facultades', descripcion: 'Crear nuevas facultades', nivelRiesgo: 3 },
      { codigo: 'update_faculties', nombre: 'Actualizar Facultades', categoria: 'Gestión Académica', modulo: 'facultades', descripcion: 'Modificar información de facultades', nivelRiesgo: 2 },
      { codigo: 'manage_careers', nombre: 'Gestionar Carreras', categoria: 'Gestión Académica', modulo: 'carreras', descripcion: 'Crear, actualizar y eliminar carreras', nivelRiesgo: 3 },
      { codigo: 'create_careers', nombre: 'Crear Carreras', categoria: 'Gestión Académica', modulo: 'carreras', descripcion: 'Crear nuevas carreras', nivelRiesgo: 2 },
      { codigo: 'update_careers', nombre: 'Actualizar Carreras', categoria: 'Gestión Académica', modulo: 'carreras', descripcion: 'Modificar información de carreras', nivelRiesgo: 2 },
      
      // Dashboards
      { codigo: 'view_all_dashboards', nombre: 'Ver Todos los Dashboards', categoria: 'Dashboards', modulo: 'dashboard', descripcion: 'Acceso a todos los dashboards del sistema', nivelRiesgo: 1 },
      { codigo: 'view_faculty_dashboard', nombre: 'Ver Dashboard de Facultad', categoria: 'Dashboards', modulo: 'dashboard', descripcion: 'Ver dashboard específico de facultad', nivelRiesgo: 1 },
      { codigo: 'view_career_dashboard', nombre: 'Ver Dashboard de Carrera', categoria: 'Dashboards', modulo: 'dashboard', descripcion: 'Ver dashboard específico de carrera', nivelRiesgo: 1 },
      
      // Reportes
      { codigo: 'generate_all_reports', nombre: 'Generar Todos los Reportes', categoria: 'Reportes', modulo: 'reportes', descripcion: 'Generar cualquier tipo de reporte del sistema', nivelRiesgo: 2 },
      { codigo: 'generate_faculty_reports', nombre: 'Generar Reportes de Facultad', categoria: 'Reportes', modulo: 'reportes', descripcion: 'Generar reportes específicos de facultad', nivelRiesgo: 1 },
      { codigo: 'generate_career_reports', nombre: 'Generar Reportes de Carrera', categoria: 'Reportes', modulo: 'reportes', descripcion: 'Generar reportes específicos de carrera', nivelRiesgo: 1 },
      
      // Sistema
      { codigo: 'manage_system_settings', nombre: 'Gestionar Configuración', categoria: 'Sistema', modulo: 'sistema', descripcion: 'Modificar configuraciones del sistema', nivelRiesgo: 5 },
      { codigo: 'view_audit_logs', nombre: 'Ver Logs de Auditoría', categoria: 'Sistema', modulo: 'auditoria', descripcion: 'Acceder a registros de auditoría', nivelRiesgo: 2 },
      { codigo: 'manage_roles', nombre: 'Gestionar Roles', categoria: 'Sistema', modulo: 'roles', descripcion: 'Crear y modificar roles y permisos', nivelRiesgo: 5 },
      
      // Perfil Personal
      { codigo: 'view_profile', nombre: 'Ver Perfil', categoria: 'Perfil', modulo: 'usuarios', descripcion: 'Ver perfil personal', nivelRiesgo: 0 },
      { codigo: 'update_profile', nombre: 'Actualizar Perfil', categoria: 'Perfil', modulo: 'usuarios', descripcion: 'Actualizar perfil personal', nivelRiesgo: 1 },
    ];

    for (const permissionData of defaultPermissions) {
      const existing = await this.permisoModel.findOne({
        where: { codigo: permissionData.codigo }
      });

      if (!existing) {
        await this.permisoModel.create(permissionData as any);
      }
    }
  }
}