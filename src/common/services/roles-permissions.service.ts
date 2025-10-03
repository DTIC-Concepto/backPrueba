import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RolEnum } from '../enums/rol.enum';
import { PermisosService } from './permisos.service';
import { PermisoModel } from '../models/permiso.model';
import { RolPermisoModel } from '../models/rol-permiso.model';

interface RolInfo {
  descripcion: string;
  permisos: string[];
  nivelAutoridad: number;
}

interface RolWithPermissions {
  rol: RolEnum;
  descripcion: string;
  nivelAutoridad: number;
  permisos: {
    codigo: string;
    nombre: string;
    descripcion: string;
    categoria: string;
    modulo: string;
    nivelRiesgo: number;
    activo: boolean;
  }[];
}

@Injectable()
export class RolesPermissionsService {
  private readonly logger = new Logger(RolesPermissionsService.name);

  constructor(
    private readonly permisosService: PermisosService,
    @InjectModel(PermisoModel)
    private readonly permisoModel: typeof PermisoModel,
    @InjectModel(RolPermisoModel)
    private readonly rolPermisoModel: typeof RolPermisoModel,
  ) {}

  // Información básica de roles (solo metadatos, no permisos)
  private readonly rolesMetadata: Record<RolEnum, { descripcion: string; nivelAutoridad: number }> = {
    [RolEnum.ADMINISTRADOR]: {
      descripcion: 'Administrador del sistema con acceso completo a todas las funcionalidades',
      nivelAutoridad: 10,
    },
    [RolEnum.DGIP]: {
      descripcion: 'Director General de Investigación y Posgrado con permisos de supervisión académica',
      nivelAutoridad: 9,
    },
    [RolEnum.DECANO]: {
      descripcion: 'Decano de facultad con autoridad sobre su facultad específica',
      nivelAutoridad: 8,
    },
    [RolEnum.SUBDECANO]: {
      descripcion: 'Subdecano con autoridad delegada en su facultad',
      nivelAutoridad: 7,
    },
    [RolEnum.JEFE_DEPARTAMENTO]: {
      descripcion: 'Jefe de departamento con autoridad sobre profesores de su departamento',
      nivelAutoridad: 6,
    },
    [RolEnum.COORDINADOR]: {
      descripcion: 'Coordinador de carrera con gestión específica de una carrera',
      nivelAutoridad: 5,
    },
    [RolEnum.PROFESOR]: {
      descripcion: 'Profesor con acceso básico a funcionalidades académicas',
      nivelAutoridad: 4,
    },
    [RolEnum.CEI]: {
      descripcion: 'Comité de Ética en Investigación con permisos especializados',
      nivelAutoridad: 7,
    },
  };

  /**
   * Obtiene todos los permisos disponibles en el sistema desde la base de datos
   */
  async getAllPermissions(): Promise<PermisoModel[]> {
    try {
      return await this.permisoModel.findAll({
        where: { activo: true },
        order: [['categoria', 'ASC'], ['modulo', 'ASC'], ['nombre', 'ASC']],
      });
    } catch (error) {
      this.logger.error('Error obteniendo permisos desde BD:', error);
      return [];
    }
  }

  /**
   * Obtiene todos los roles con sus permisos desde la base de datos
   */
  async getAllRolesWithPermissions(): Promise<RolWithPermissions[]> {
    try {
      const rolesWithPermissions: RolWithPermissions[] = [];

      for (const rol of Object.values(RolEnum)) {
        const permisos = await this.getPermissionsForRole(rol);
        const metadata = this.rolesMetadata[rol];

        rolesWithPermissions.push({
          rol,
          descripcion: metadata.descripcion,
          nivelAutoridad: metadata.nivelAutoridad,
          permisos: permisos.map(p => ({
            codigo: p.codigo,
            nombre: p.nombre,
            descripcion: p.descripcion,
            categoria: p.categoria,
            modulo: p.modulo,
            nivelRiesgo: p.nivelRiesgo,
            activo: p.activo,
          })),
        });
      }

      return rolesWithPermissions.sort((a, b) => b.nivelAutoridad - a.nivelAutoridad);
    } catch (error) {
      this.logger.error('Error obteniendo roles con permisos desde BD:', error);
      return [];
    }
  }

  /**
   * Obtiene los permisos específicos de un rol desde la base de datos
   */
  async getPermissionsForRole(rol: RolEnum): Promise<PermisoModel[]> {
    try {
      const permisos = await this.permisoModel.findAll({
        include: [
          {
            model: RolPermisoModel,
            where: {
              rol: rol,
              activo: true,
            },
            required: true,
          },
        ],
        where: { activo: true },
        order: [['categoria', 'ASC'], ['modulo', 'ASC'], ['nombre', 'ASC']],
      });

      return permisos;
    } catch (error) {
      this.logger.error(`Error obteniendo permisos para rol ${rol} desde BD:`, error);
      return [];
    }
  }

  /**
   * Obtiene los códigos de permisos para un rol específico
   */
  async getPermissionCodesForRole(rol: RolEnum): Promise<string[]> {
    const permisos = await this.getPermissionsForRole(rol);
    return permisos.map(p => p.codigo);
  }

  /**
   * Verifica si un rol tiene un permiso específico
   */
  async hasPermission(rol: RolEnum, permissionCode: string): Promise<boolean> {
    try {
      const count = await this.rolPermisoModel.count({
        include: [
          {
            model: PermisoModel,
            where: {
              codigo: permissionCode,
              activo: true,
            },
            required: true,
          },
        ],
        where: {
          rol: rol,
          activo: true,
        },
      });

      return count > 0;
    } catch (error) {
      this.logger.error(`Error verificando permiso ${permissionCode} para rol ${rol}:`, error);
      return false;
    }
  }

  /**
   * Consolida permisos para múltiples roles (para usuarios con múltiples roles)
   */
  async consolidatePermissionsForRoles(roles: RolEnum[]): Promise<PermisoModel[]> {
    try {
      if (!roles || roles.length === 0) {
        return [];
      }

      const allPermissions = new Map<string, PermisoModel>();

      for (const rol of roles) {
        const rolePermissions = await this.getPermissionsForRole(rol);
        
        rolePermissions.forEach(permiso => {
          allPermissions.set(permiso.codigo, permiso);
        });
      }

      return Array.from(allPermissions.values())
        .sort((a, b) => {
          // Ordenar por categoría, luego por módulo, luego por nombre
          if (a.categoria !== b.categoria) {
            return a.categoria.localeCompare(b.categoria);
          }
          if (a.modulo !== b.modulo) {
            return a.modulo.localeCompare(b.modulo);
          }
          return a.nombre.localeCompare(b.nombre);
        });
    } catch (error) {
      this.logger.error('Error consolidando permisos para múltiples roles:', error);
      return [];
    }
  }

  /**
   * Obtiene los códigos de permisos consolidados para múltiples roles
   */
  async consolidatePermissionCodesForRoles(roles: RolEnum[]): Promise<string[]> {
    const permisos = await this.consolidatePermissionsForRoles(roles);
    return permisos.map(p => p.codigo);
  }

  /**
   * Obtiene información básica de un rol
   */
  getRoleInfo(rol: RolEnum): { descripcion: string; nivelAutoridad: number } {
    return this.rolesMetadata[rol] || { 
      descripcion: 'Rol desconocido', 
      nivelAutoridad: 0 
    };
  }

  /**
   * Obtiene todos los roles ordenados por nivel de autoridad
   */
  getAllRoles(): RolEnum[] {
    return Object.values(RolEnum).sort((a, b) => {
      const nivelA = this.rolesMetadata[a]?.nivelAutoridad || 0;
      const nivelB = this.rolesMetadata[b]?.nivelAutoridad || 0;
      return nivelB - nivelA; // Orden descendente
    });
  }

  /**
   * Verifica si un usuario con ciertos roles puede realizar una acción específica
   */
  async canPerformAction(userRoles: RolEnum[], requiredPermission: string): Promise<boolean> {
    try {
      for (const rol of userRoles) {
        const hasPermission = await this.hasPermission(rol, requiredPermission);
        if (hasPermission) {
          return true;
        }
      }
      return false;
    } catch (error) {
      this.logger.error(`Error verificando acción ${requiredPermission} para roles:`, error);
      return false;
    }
  }

  /**
   * Obtiene métricas sobre el sistema de permisos
   */
  async getPermissionsMetrics(): Promise<{
    totalPermisos: number;
    permisosPorCategoria: Record<string, number>;
    permisosPorNivelRiesgo: Record<string, number>;
    rolesConMasPermisos: { rol: string; cantidad: number }[];
  }> {
    try {
      const allPermissions = await this.getAllPermissions();
      const allRolesWithPermissions = await this.getAllRolesWithPermissions();

      const permisosPorCategoria: Record<string, number> = {};
      const permisosPorNivelRiesgo: Record<string, number> = {};

      allPermissions.forEach(permiso => {
        // Contar por categoría
        permisosPorCategoria[permiso.categoria] = (permisosPorCategoria[permiso.categoria] || 0) + 1;
        
        // Contar por nivel de riesgo
        const nivelRiesgo = `Nivel ${permiso.nivelRiesgo}`;
        permisosPorNivelRiesgo[nivelRiesgo] = (permisosPorNivelRiesgo[nivelRiesgo] || 0) + 1;
      });

      const rolesConMasPermisos = allRolesWithPermissions
        .map(r => ({ rol: r.rol, cantidad: r.permisos.length }))
        .sort((a, b) => b.cantidad - a.cantidad);

      return {
        totalPermisos: allPermissions.length,
        permisosPorCategoria,
        permisosPorNivelRiesgo,
        rolesConMasPermisos,
      };
    } catch (error) {
      this.logger.error('Error obteniendo métricas de permisos:', error);
      return {
        totalPermisos: 0,
        permisosPorCategoria: {},
        permisosPorNivelRiesgo: {},
        rolesConMasPermisos: [],
      };
    }
  }

  /**
   * MÉTODO DE RESPALDO: Si no hay datos en BD, usar permisos básicos hardcodeados
   * Solo se usa como fallback de emergencia
   */
  private getFallbackPermissionsForRole(rol: RolEnum): string[] {
    const fallbackPermissions: Record<RolEnum, string[]> = {
      [RolEnum.ADMINISTRADOR]: ['manage_users', 'view_users', 'manage_roles', 'view_admin_dashboard', 'view_profile'],
      [RolEnum.DGIP]: ['view_users', 'view_admin_dashboard', 'manage_faculties', 'view_profile'],
      [RolEnum.DECANO]: ['view_users', 'view_faculty_dashboard', 'view_faculties', 'view_profile'],
      [RolEnum.SUBDECANO]: ['view_users', 'view_faculty_dashboard', 'view_faculties', 'view_profile'],
      [RolEnum.JEFE_DEPARTAMENTO]: ['view_users', 'view_faculty_dashboard', 'view_careers', 'view_profile'],
      [RolEnum.COORDINADOR]: ['view_users', 'view_personal_dashboard', 'view_careers', 'view_profile'],
      [RolEnum.PROFESOR]: ['view_personal_dashboard', 'view_profile'],
      [RolEnum.CEI]: ['view_users', 'view_personal_dashboard', 'view_audit_logs', 'view_profile'],
    };

    return fallbackPermissions[rol] || ['view_profile'];
  }
}