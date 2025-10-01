import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { UsuarioModel } from './models/usuario.model';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { FilterUsuarioDto } from './dto/filter-usuario.dto';
import { RolEnum } from '../common/enums/rol.enum';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(UsuarioModel)
    private readonly usuarioModel: typeof UsuarioModel,
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

  async findAll(filterDto?: FilterUsuarioDto): Promise<UsuarioModel[]> {
    const whereClause: any = {};

    // Filtrar por rol específico (HU5092)
    if (filterDto?.rol) {
      whereClause.rol = filterDto.rol;
    }

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

    const usuarios = await this.usuarioModel.findAll({
      where: whereClause,
      order: [['apellidos', 'ASC'], ['nombres', 'ASC']],
    });

    // Retorna array vacío si no hay coincidencias (cumple HU5092)
    return usuarios;
  }

  async findOne(id: number): Promise<UsuarioModel> {
    const usuario = await this.usuarioModel.findByPk(id);
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

    // Filtrar por rol si está especificado
    if (searchDto?.rol) {
      whereClause.rol = searchDto.rol;
    }

    // Búsqueda por término en nombres, apellidos o correo
    if (searchDto?.search) {
      whereClause[Op.or] = [
        { nombres: { [Op.iLike]: `%${searchDto.search}%` } },
        { apellidos: { [Op.iLike]: `%${searchDto.search}%` } },
        { correo: { [Op.iLike]: `%${searchDto.search}%` } },
      ];
    }

    const usuarios = await this.usuarioModel.findAll({
      where: whereClause,
      attributes: ['id', 'nombres', 'apellidos', 'correo', 'rol', 'estadoActivo'],
      order: [['apellidos', 'ASC'], ['nombres', 'ASC']],
      limit: 50, // Limitar resultados para performance
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