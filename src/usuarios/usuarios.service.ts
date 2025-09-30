import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { UsuarioModel } from './models/usuario.model';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { FilterUsuarioDto } from './dto/filter-usuario.dto';

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

    try {
      // Crear el usuario - los hooks se encargarán de encriptar la contraseña
      const usuario = await this.usuarioModel.create({
        nombres: createUsuarioDto.nombres,
        apellidos: createUsuarioDto.apellidos,
        cedula: createUsuarioDto.cedula,
        correo: createUsuarioDto.correo,
        contrasena: createUsuarioDto.contrasena,
        rol: createUsuarioDto.rol,
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
}