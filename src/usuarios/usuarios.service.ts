import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { UsuarioModel } from './models/usuario.model';
import { UsuarioRolModel } from '../common/models/usuario-rol.model';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdateStatusUsuarioDto } from './dto/update-status-usuario.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { SearchPaginatedUsuarioDto } from './dto/search-paginated-usuario.dto';
import { UsuarioPaginatedResponseDto } from './dto/usuario-paginated-response.dto';
import { FilterUsuarioDto } from './dto/filter-usuario.dto';
import { UserRolesPermissionsDto } from './dto/user-roles-permissions.dto';
import { RolEnum } from '../common/enums/rol.enum';
import { RolesPermissionsService } from '../common/services/roles-permissions.service';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(UsuarioModel)
    private readonly usuarioModel: typeof UsuarioModel,
    @InjectModel(UsuarioRolModel)
    private readonly usuarioRolModel: typeof UsuarioRolModel,
    private readonly rolesPermissionsService: RolesPermissionsService,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto): Promise<UsuarioModel> {
    // Verificar si ya existe un usuario con el mismo correo
    const existingUserByEmail = await this.usuarioModel.findOne({
      where: { correo: createUsuarioDto.correo }
    });
    
    if (existingUserByEmail) {
      throw new BadRequestException('Ya existe un usuario con este correo electrónico');
    }

    // Verificar si ya existe un usuario con la misma cédula
    const existingUserByCedula = await this.usuarioModel.findOne({
      where: { cedula: createUsuarioDto.cedula }
    });
    
    if (existingUserByCedula) {
      throw new BadRequestException('Ya existe un usuario con esta cédula');
    }

    // Validar roles únicos por facultad
    await this.validateUniqueRolePerFaculty(createUsuarioDto.rol, createUsuarioDto.facultadId);

    try {
      // Crear el usuario - los hooks se encargarán de encriptar la contraseña
      const usuario = await this.usuarioModel.create({
        nombres: createUsuarioDto.nombres,
        apellidos: createUsuarioDto.apellidos,
        cedula: createUsuarioDto.cedula,
        correo: createUsuarioDto.correo,
        contrasena: createUsuarioDto.contrasena,
        rol: createUsuarioDto.rol,
        facultadId: createUsuarioDto.facultadId,
        estadoActivo: createUsuarioDto.estadoActivo ?? true,
      } as any);
      
      return usuario;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new BadRequestException('Error de duplicación: El correo o cédula ya están registrados');
      }
      throw new BadRequestException('Error al crear el usuario: ' + error.message);
    }
  }

  // Nuevo método para crear usuarios con múltiples roles
  async createWithMultipleRoles(createDto: any): Promise<UsuarioModel> {
    const { roles, rolPrincipal, asignadoPor, ...usuarioData } = createDto;

    // Validar que el rol principal esté incluido en la lista de roles
    const rolPrincipalIncluido = roles.some((r: any) => r.rol === rolPrincipal);
    if (!rolPrincipalIncluido) {
      throw new BadRequestException('El rol principal debe estar incluido en la lista de roles');
    }

    // Verificar si ya existe un usuario con el mismo correo
    const existingUserByEmail = await this.usuarioModel.findOne({
      where: { correo: usuarioData.correo }
    });
    
    if (existingUserByEmail) {
      throw new BadRequestException('Ya existe un usuario con este correo electrónico');
    }

    // Verificar si ya existe un usuario con la misma cédula
    const existingUserByCedula = await this.usuarioModel.findOne({
      where: { cedula: usuarioData.cedula }
    });
    
    if (existingUserByCedula) {
      throw new BadRequestException('Ya existe un usuario con esta cédula');
    }

    // Validar roles únicos por facultad para todos los roles
    for (const rolInfo of roles) {
      await this.validateUniqueRolePerFaculty(rolInfo.rol, usuarioData.facultadId);
    }

    // Verificar que roles que requieren facultad la tengan
    const rolesRequierenFacultad = ['DECANO', 'SUBDECANO', 'JEFE_DEPARTAMENTO'];
    const rolesConFacultadRequerida = roles.filter((r: any) => rolesRequierenFacultad.includes(r.rol));
    
    if (rolesConFacultadRequerida.length > 0 && !usuarioData.facultadId) {
      const rolesStr = rolesConFacultadRequerida.map((r: any) => r.rol).join(', ');
      throw new BadRequestException(`Los roles ${rolesStr} requieren especificar una facultad`);
    }

    try {
      // Usar transacción para asegurar consistencia
      const result = await this.usuarioModel.sequelize!.transaction(async (transaction) => {
        // Crear el usuario principal
        const usuario = await this.usuarioModel.create({
          nombres: usuarioData.nombres,
          apellidos: usuarioData.apellidos,
          cedula: usuarioData.cedula,
          correo: usuarioData.correo,
          contrasena: usuarioData.contrasena,
          rol: rolPrincipal, // El rol principal para compatibilidad
          facultadId: usuarioData.facultadId,
          estadoActivo: usuarioData.estadoActivo ?? true,
        } as any, { transaction });

        // Asegurar que el usuario se haya creado correctamente y tenga ID
        if (!usuario.id) {
          throw new Error('No se pudo obtener el ID del usuario creado');
        }

        // Crear las relaciones usuario-rol para todos los roles (incluido el principal)
        const usuarioRoles = roles.map((rolInfo: any) => ({
          usuarioId: usuario.id,
          rol: rolInfo.rol,
          activo: true,
          observaciones: rolInfo.observaciones || `Rol ${rolInfo.rol} asignado`,
          asignadoPor: asignadoPor || 'Sistema',
        }));

        await this.usuarioRolModel.bulkCreate(usuarioRoles, { transaction });

        return usuario;
      });

      // Recargar el usuario con todas sus relaciones
      return await this.findOneWithRoles(result.id);
    } catch (error) {
      console.error('Error al crear usuario con múltiples roles:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new BadRequestException('Error de duplicación: El correo o cédula ya están registrados');
      }
      throw new BadRequestException('Error al crear el usuario: ' + error.message);
    }
  }

  async findAll(filterDto?: FilterUsuarioDto): Promise<UsuarioModel[]> {
    const whereClause: any = {};
    const includeClause: any[] = [];

    // Filtrar por estado activo
    if (filterDto?.estadoActivo !== undefined) {
      whereClause.estadoActivo = filterDto.estadoActivo;
    }

    // Búsqueda por texto en nombres, apellidos o correo
    if (filterDto?.search) {
      whereClause[Op.or] = [
        { nombres: { [Op.iLike]: `%${filterDto.search}%` } },
        { apellidos: { [Op.iLike]: `%${filterDto.search}%` } },
        { correo: { [Op.iLike]: `%${filterDto.search}%` } },
      ];
    }

    // Filtrar por rol específico (HU5092) - Mejorado para consultar también usuario_roles
    if (filterDto?.rol) {
      // Si se especifica un rol, buscar tanto en el rol principal como en usuario_roles
      whereClause[Op.or] = [
        { rol: filterDto.rol }, // Rol principal
        {
          '$usuarioRoles.rol$': filterDto.rol, // Roles adicionales
          '$usuarioRoles.activo$': true
        }
      ];

      // Incluir la relación con usuario_roles para el filtro
      includeClause.push({
        model: this.usuarioRolModel,
        as: 'usuarioRoles',
        required: false, // LEFT JOIN para no excluir usuarios sin roles adicionales
        attributes: [], // No necesitamos los datos, solo para el filtro
        where: {
          activo: true
        }
      });
    }

    const usuarios = await this.usuarioModel.findAll({
      where: whereClause,
      include: includeClause,
      order: [['apellidos', 'ASC'], ['nombres', 'ASC']],
      subQuery: false, // Evitar subconsultas que pueden causar duplicados
    });

    // Retorna array vacío si no hay coincidencias (cumple HU5092)
    return usuarios;
  }

  // HU5099 & HU5107: Búsqueda paginada de usuarios
  async findAllPaginated(searchDto: SearchPaginatedUsuarioDto): Promise<UsuarioPaginatedResponseDto> {
    const { search, page = 1, limit = 10, rol } = searchDto;
    
    // Construir condiciones de búsqueda (HU5099)
    const whereClause: any = {};
    const includeClause: any[] = [
      {
        association: 'facultad',
        attributes: ['id', 'nombre', 'codigo'],
        required: false,
      },
    ];

    // Construir condiciones de búsqueda y filtros
    const searchConditions: any[] = [];
    const roleConditions: any[] = [];

    // Si hay palabra clave, buscar en email, nombre, apellidos o cédula
    if (search && search.trim()) {
      searchConditions.push(
        { correo: { [Op.iLike]: `%${search.trim()}%` } },
        { nombres: { [Op.iLike]: `%${search.trim()}%` } },
        { apellidos: { [Op.iLike]: `%${search.trim()}%` } },
        { cedula: { [Op.iLike]: `%${search.trim()}%` } }
      );
    }

    // Filtrar por rol específico - Mejorado para consultar también usuario_roles
    if (rol) {
      roleConditions.push(
        { rol: rol }, // Rol principal
        {
          '$usuarioRoles.rol$': rol, // Roles adicionales
          '$usuarioRoles.activo$': true
        }
      );

      // Incluir la relación con usuario_roles para el filtro
      includeClause.push({
        model: this.usuarioRolModel,
        as: 'usuarioRoles',
        required: false, // LEFT JOIN para no excluir usuarios sin roles adicionales
        attributes: ['rol', 'activo'], // Incluir algunos datos para debugging
        where: {
          activo: true
        }
      });
    }

    // Combinar condiciones
    if (searchConditions.length > 0 && roleConditions.length > 0) {
      // Si hay búsqueda de texto Y filtro de rol, combinar ambos
      whereClause[Op.and] = [
        { [Op.or]: searchConditions },
        { [Op.or]: roleConditions }
      ];
    } else if (searchConditions.length > 0) {
      // Solo búsqueda de texto
      whereClause[Op.or] = searchConditions;
    } else if (roleConditions.length > 0) {
      // Solo filtro de rol
      whereClause[Op.or] = roleConditions;
    }

    // Configurar paginación (HU5107)
    const offset = (page - 1) * limit;

    // Ejecutar consulta con paginación
    const { count: totalItems, rows: usuarios } = await this.usuarioModel.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['apellidos', 'ASC'], ['nombres', 'ASC']],
      include: includeClause,
      subQuery: false, // Evitar subconsultas que pueden causar duplicados
    });

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Construir respuesta
    const response: UsuarioPaginatedResponseDto = {
      data: usuarios,
      meta: {
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        searchTerm: search?.trim() || undefined,
      },
    };

    return response;
  }

  async findOne(id: number): Promise<UsuarioModel> {
    const usuario = await this.usuarioModel.findByPk(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return usuario;
  }

  // Método para cargar usuario con todos sus roles (para autenticación)
  async findOneWithRoles(id: number): Promise<UsuarioModel> {
    const usuario = await this.usuarioModel.findByPk(id, {
      include: [
        {
          model: this.usuarioRolModel,
          as: 'usuarioRoles',
          where: { activo: true },
          required: false,
        },
        {
          association: 'facultad',
          attributes: ['id', 'nombre', 'codigo'],
          required: false,
        },
      ],
    });
    
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    
    return usuario;
  }

  async findByEmail(correo: string): Promise<UsuarioModel | null> {
    return this.usuarioModel.findOne({
      where: { correo },
      // Incluir explícitamente todos los campos incluyendo la contraseña
      attributes: ['id', 'nombres', 'apellidos', 'cedula', 'correo', 'contrasena', 'rol', 'estadoActivo', 'createdAt', 'updatedAt'],
    });
  }

  async findUserRoles(usuarioId: number): Promise<UsuarioRolModel[]> {
    return await this.usuarioRolModel.findAll({
      where: { usuarioId },
      attributes: ['id', 'usuarioId', 'rol', 'activo', 'observaciones', 'asignadoPor', 'createdAt', 'updatedAt'],
    });
  }

  async findByEmailWithRoles(correo: string): Promise<UsuarioModel | null> {
    console.log('🔍 findByEmailWithRoles - Buscando usuario con correo:', correo);
    
    try {
      // Primero buscar el usuario sin include para verificar que existe
      const usuarioSimple = await this.usuarioModel.findOne({
        where: { correo }
      });

      console.log('👤 Usuario simple encontrado:', {
        id: usuarioSimple?.id,
        correo: usuarioSimple?.correo,
        rol: usuarioSimple?.rol
      });

      if (!usuarioSimple) {
        return null;
      }

      // Buscar roles directamente con el ID del usuario
      const rolesDirectos = await this.usuarioRolModel.findAll({
        where: { usuarioId: usuarioSimple.id }
      });

      console.log('🎭 Roles encontrados directamente:', rolesDirectos.map(r => ({
        id: r.id,
        usuarioId: r.usuarioId,
        rol: r.rol,
        activo: r.activo
      })));

      // Ahora hacer la consulta con include
      const usuario = await this.usuarioModel.findOne({
        where: { correo },
        attributes: ['id', 'nombres', 'apellidos', 'cedula', 'correo', 'contrasena', 'rol', 'estadoActivo', 'createdAt', 'updatedAt'],
        include: [
          {
            model: this.usuarioRolModel,
            as: 'usuarioRoles',
            required: false,
            attributes: ['id', 'usuarioId', 'rol', 'activo', 'observaciones', 'asignadoPor', 'createdAt', 'updatedAt'],
          },
        ],
      });

      console.log('👤 Usuario con include:', {
        id: usuario?.id,
        correo: usuario?.correo,
        rol: usuario?.rol,
        estadoActivo: usuario?.estadoActivo
      });

      console.log('� UsuarioRoles desde include:', usuario?.usuarioRoles?.map(ur => ({
        id: ur.id,
        usuarioId: ur.usuarioId,
        rol: ur.rol,
        activo: ur.activo,
        asignadoPor: ur.asignadoPor
      })));

      console.log('📊 Total roles encontrados:', usuario?.usuarioRoles?.length || 0);

      return usuario;
    } catch (error) {
      console.error('❌ Error en findByEmailWithRoles:', error);
      throw error;
    }
  }

  async findByCedula(cedula: string): Promise<UsuarioModel | null> {
    return this.usuarioModel.findOne({
      where: { cedula },
    });
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto): Promise<UsuarioModel> {
    const usuario = await this.findOne(id);
    
    // Si se está actualizando el rol o facultadId, validar roles únicos
    if (updateUsuarioDto.rol || updateUsuarioDto.facultadId !== undefined) {
      const newRol = updateUsuarioDto.rol || usuario.rol;
      const newFacultadId = updateUsuarioDto.facultadId !== undefined ? updateUsuarioDto.facultadId : usuario.facultadId;
      
      await this.validateUniqueRolePerFaculty(newRol, newFacultadId, id);
    }
    
    try {
      await usuario.update(updateUsuarioDto);
      return usuario;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new BadRequestException('El correo o cédula ya están registrados');
      }
      throw error;
    }
  }

  // HU5095: Cambiar estado de usuario (activar/desactivar)
  async updateStatus(id: number, updateStatusDto: UpdateStatusUsuarioDto): Promise<UsuarioModel> {
    const usuario = await this.usuarioModel.findByPk(id);
    
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Actualizar el estado del usuario
    await usuario.update({ 
      estadoActivo: updateStatusDto.estadoActivo 
    });

    // Retornar el usuario actualizado
    return usuario.reload();
  }

  // HU5115: Cambiar contraseña personal del usuario
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { contrasenaActual, contrasenaNueva, confirmarContrasena } = changePasswordDto;

    // Verificar que las contraseñas nuevas coincidan
    if (contrasenaNueva !== confirmarContrasena) {
      throw new BadRequestException('La nueva contraseña y la confirmación no coinciden');
    }

    // Buscar el usuario
    const usuario = await this.usuarioModel.findByPk(userId);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    // Verificar que el usuario esté activo
    if (!usuario.estadoActivo) {
      throw new BadRequestException('No se puede cambiar la contraseña de un usuario inactivo');
    }

    // Verificar la contraseña actual
    const isCurrentPasswordValid = await usuario.validatePassword(contrasenaActual);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Verificar que la nueva contraseña sea diferente a la actual
    const isSamePassword = await usuario.validatePassword(contrasenaNueva);
    if (isSamePassword) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
    }

    // Actualizar la contraseña (el hook se encargará del hashing)
    await usuario.update({ contrasena: contrasenaNueva });

    return { message: 'Contraseña actualizada exitosamente' };
  }

  // HU5116: Obtener perfil personal del usuario autenticado
  async getProfile(userId: number, rolActivo?: string): Promise<UserProfileDto> {
    const usuario = await this.usuarioModel.findByPk(userId, {
      include: [
        {
          association: 'facultad',
          attributes: ['id', 'nombre', 'codigo'],
          required: false,
        },
      ],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    // Verificar que el usuario esté activo
    if (!usuario.estadoActivo) {
      throw new BadRequestException('Perfil no disponible para usuario inactivo');
    }

    // Obtener todos los roles del usuario
    const usuarioRoles = await this.findUserRoles(userId);
    const rolesDisponibles = usuarioRoles
      .filter(ur => ur.activo === true)
      .map(ur => ur.rol);

    // Construir respuesta del perfil (sin contraseña ni datos sensibles)
    const profile: UserProfileDto = {
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      cedula: usuario.cedula,
      correo: usuario.correo,
      rol: (rolActivo as RolEnum) || usuario.rol, // Usar el rol activo del JWT o el rol principal como fallback
      rolPrincipal: usuario.rol, // El rol principal del usuario
      rolesDisponibles, // Todos los roles disponibles
      estadoActivo: usuario.estadoActivo,
      facultad: usuario.facultad ? {
        id: usuario.facultad.id,
        nombre: usuario.facultad.nombre,
        codigo: usuario.facultad.codigo,
      } : undefined,
      createdAt: usuario.createdAt,
      updatedAt: usuario.updatedAt,
    };

    return profile;
  }

  // HU5113: Obtener roles y permisos del usuario autenticado
  async getUserRolesAndPermissions(userId: number): Promise<UserRolesPermissionsDto> {
    const usuario = await this.usuarioModel.findByPk(userId, {
      include: [
        {
          association: 'facultad',
          attributes: ['id', 'nombre', 'codigo'],
          required: false,
        },
      ],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    if (!usuario.estadoActivo) {
      throw new BadRequestException('No se pueden obtener roles y permisos de un usuario inactivo');
    }

    // Obtener todos los roles del usuario desde la tabla usuario_roles
    const usuarioRoles = await this.findUserRoles(userId);
    const rolesActivos = usuarioRoles.filter(ur => ur.activo === true);
    
    // Incluir el rol principal si no está en los roles adicionales
    const rolesDisponibles = rolesActivos.map(ur => ur.rol);
    if (!rolesDisponibles.includes(usuario.rol)) {
      rolesDisponibles.push(usuario.rol);
    }
    
    // Construir información de roles
    const rolesInfo: any[] = [];
    for (const rol of rolesDisponibles) {
      const rolInfo = this.rolesPermissionsService.getRoleInfo(rol as RolEnum);
      const permisos = await this.rolesPermissionsService.getPermissionCodesForRole(rol);
      
      // Buscar información específica del usuario-rol si existe
      const usuarioRol = usuario.usuarioRoles?.find(ur => ur.rol === rol);
      
      rolesInfo.push({
        rol,
        descripcion: rolInfo.descripcion,
        permisos: permisos,
        nivelAutoridad: rolInfo.nivelAutoridad,
        esPrincipal: rol === usuario.rol, // El rol original es el principal
        activo: usuarioRol?.activo ?? true, // Si es el rol principal, está activo
        fechaAsignacion: usuarioRol?.createdAt ?? usuario.createdAt,
      });
    }

    // Consolidar permisos únicos
    const todosLosPermisos = await this.rolesPermissionsService.consolidatePermissionCodesForRoles(rolesDisponibles as RolEnum[]);
    
    // Obtener nivel máximo de autoridad
    const nivelMaximoAutoridad = Math.max(...rolesDisponibles.map(rol => this.rolesPermissionsService.getRoleInfo(rol as RolEnum).nivelAutoridad));
    
    // Analizar capacidades del usuario (simplificado)
    const permissionsSet = new Set(todosLosPermisos);
    const capacidades = {
      puedeGestionarUsuarios: permissionsSet.has('gestionar_usuarios') || permissionsSet.has('crear_usuarios'),
      puedeCrearCarreras: permissionsSet.has('gestionar_carreras') || permissionsSet.has('crear_carreras'),
      puedeVerDashboard: todosLosPermisos.some(p => p && p.includes('dashboard')),
      puedeGenerarReportes: todosLosPermisos.some(p => p && p.includes('reportes')),
      esAdministrador: rolesDisponibles.includes(RolEnum.ADMINISTRADOR),
      esDecano: rolesDisponibles.includes(RolEnum.DECANO),
      esCoordinador: rolesDisponibles.includes(RolEnum.COORDINADOR),
    };

    // Construir respuesta
    const response: UserRolesPermissionsDto = {
      usuarioId: usuario.id,
      nombreCompleto: `${usuario.nombres} ${usuario.apellidos}`,
      rolPrincipal: usuario.rol,
      roles: rolesInfo,
      permisosConsolidados: todosLosPermisos,
      nivelMaximoAutoridad,
      facultad: usuario.facultad ? {
        id: usuario.facultad.id,
        nombre: usuario.facultad.nombre,
        codigo: usuario.facultad.codigo,
      } : undefined,
      capacidades,
    };

    return response;
  }

  async remove(id: number): Promise<void> {
    const usuario = await this.findOne(id);
    await usuario.update({ estadoActivo: false });
  }

  async restore(id: number): Promise<UsuarioModel> {
    const usuario = await this.findOne(id);
    await usuario.update({ estadoActivo: true });
    return usuario;
  }

  // Método para búsqueda de usuarios (para selección de decanos, etc.)
  async searchUsuarios(searchDto?: { search?: string; rol?: string }): Promise<UsuarioModel[]> {
    const whereClause: any = {
      estadoActivo: true, // Solo usuarios activos
    };
    const includeClause: any[] = [];

    const searchConditions: any[] = [];
    const roleConditions: any[] = [];

    // Búsqueda por término en nombres, apellidos o correo
    if (searchDto?.search) {
      searchConditions.push(
        { nombres: { [Op.iLike]: `%${searchDto.search}%` } },
        { apellidos: { [Op.iLike]: `%${searchDto.search}%` } },
        { correo: { [Op.iLike]: `%${searchDto.search}%` } }
      );
    }

    // Filtrar por rol específico - Mejorado para consultar también usuario_roles
    if (searchDto?.rol) {
      roleConditions.push(
        { rol: searchDto.rol }, // Rol principal
        {
          '$usuarioRoles.rol$': searchDto.rol, // Roles adicionales
          '$usuarioRoles.activo$': true
        }
      );

      // Incluir la relación con usuario_roles para el filtro
      includeClause.push({
        model: this.usuarioRolModel,
        as: 'usuarioRoles',
        required: false,
        attributes: [],
        where: {
          activo: true
        }
      });
    }

    // Combinar condiciones
    if (searchConditions.length > 0 && roleConditions.length > 0) {
      // Si hay búsqueda de texto Y filtro de rol, combinar ambos
      whereClause[Op.and] = [
        { [Op.or]: searchConditions },
        { [Op.or]: roleConditions }
      ];
    } else if (searchConditions.length > 0) {
      // Solo búsqueda de texto
      whereClause[Op.or] = searchConditions;
    } else if (roleConditions.length > 0) {
      // Solo filtro de rol
      whereClause[Op.or] = roleConditions;
    }

    const usuarios = await this.usuarioModel.findAll({
      where: whereClause,
      include: includeClause,
      attributes: ['id', 'nombres', 'apellidos', 'correo', 'rol', 'estadoActivo'],
      order: [['apellidos', 'ASC'], ['nombres', 'ASC']],
      limit: 50, // Limitar resultados para performance
      subQuery: false,
    });

    return usuarios;
  }

  /**
   * Valida que un rol único por facultad no esté duplicado
   * Solo DECANO y SUBDECANO pueden tener máximo 1 usuario por facultad
   */
  private async validateUniqueRolePerFaculty(
    rol: string, 
    facultadId?: number | null, 
    excludeUserId?: number
  ): Promise<void> {
    // Solo validar para roles que deben ser únicos por facultad
    const rolesUnicos = [RolEnum.DECANO, RolEnum.SUBDECANO];
    
    if (!rolesUnicos.includes(rol as RolEnum)) {
      return; // No es un rol que requiera validación
    }

    // Si el rol requiere facultadId pero no se proporciona
    if (!facultadId) {
      throw new BadRequestException(`El rol ${rol} requiere asignación a una facultad específica`);
    }

    // Buscar si ya existe un usuario con el mismo rol en la misma facultad
    const whereClause: any = {
      rol: rol,
      facultadId: facultadId,
      estadoActivo: true,
    };

    // Si estamos actualizando, excluir el usuario actual
    if (excludeUserId) {
      whereClause.id = { [Op.ne]: excludeUserId };
    }

    const existingUser = await this.usuarioModel.findOne({
      where: whereClause,
      attributes: ['id', 'nombres', 'apellidos', 'rol'],
    });

    if (existingUser) {
      throw new ConflictException(
        `Ya existe un usuario con el rol ${rol} en esta facultad: ${existingUser.nombres} ${existingUser.apellidos}`
      );
    }
  }
}