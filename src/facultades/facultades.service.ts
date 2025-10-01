import { Injectable, NotFoundException, BadRequestException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { FacultadModel } from './models/facultad.model';
import { UsuarioModel } from '../usuarios/models/usuario.model';
import { CreateFacultadDto } from './dto/create-facultad.dto';
import { UpdateFacultadDto } from './dto/update-facultad.dto';
import { FilterFacultadDto } from './dto/filter-facultad.dto';
import { FacultadListResponseDto } from './dto/facultad-list-response.dto';
import { PaginatedFacultadResponseDto } from './dto/paginated-facultad-response.dto';
import { CarrerasService } from '../carreras/carreras.service';
import { RolEnum } from '../common/enums/rol.enum';

@Injectable()
export class FacultadesService {
  constructor(
    @InjectModel(FacultadModel)
    private readonly facultadModel: typeof FacultadModel,
    @InjectModel(UsuarioModel)
    private readonly usuarioModel: typeof UsuarioModel,
    @Inject(forwardRef(() => CarrerasService))
    private readonly carrerasService: CarrerasService,
  ) {}

  async create(createFacultadDto: CreateFacultadDto): Promise<FacultadModel> {
    // Verificar si ya existe una facultad con el mismo código
    const existingFacultadByCodigo = await this.facultadModel.findOne({
      where: { codigo: createFacultadDto.codigo }
    });
    
    if (existingFacultadByCodigo) {
      throw new BadRequestException('Ya existe una facultad con este código');
    }

    // Verificar si ya existe una facultad con el mismo nombre
    const existingFacultadByNombre = await this.facultadModel.findOne({
      where: { nombre: createFacultadDto.nombre }
    });
    
    if (existingFacultadByNombre) {
      throw new BadRequestException('Ya existe una facultad con este nombre');
    }

    try {
      const facultad = await this.facultadModel.create({
        nombre: createFacultadDto.nombre,
        codigo: createFacultadDto.codigo,
        descripcion: createFacultadDto.descripcion,
        estadoActivo: createFacultadDto.estadoActivo ?? true,
      } as any);
      
      return facultad;
    } catch (error) {
      console.error('Error al crear facultad:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictException('Error de duplicación: El código ya está registrado');
      }
      throw new BadRequestException('Error al crear la facultad: ' + error.message);
    }
  }

  async findAll(filterDto?: FilterFacultadDto): Promise<FacultadModel[]> {
    const whereClause: any = {};

    if (filterDto?.estadoActivo !== undefined) {
      whereClause.estadoActivo = filterDto.estadoActivo;
    }

    if (filterDto?.search) {
      whereClause[Op.or] = [
        { nombre: { [Op.iLike]: `%${filterDto.search}%` } },
        { codigo: { [Op.iLike]: `%${filterDto.search}%` } },
        { descripcion: { [Op.iLike]: `%${filterDto.search}%` } },
      ];
    }

    return this.facultadModel.findAll({
      where: whereClause,
      order: [['nombre', 'ASC']],
    });
  }

  // Método específico para administradores con información completa
  async findAllForAdmin(filterDto?: FilterFacultadDto): Promise<FacultadListResponseDto[]> {
    const facultades = await this.findAll(filterDto);

    // Transformar los datos al formato requerido para administradores
    return await Promise.all(facultades.map(async (facultad) => {
      // Contar carreras reales por facultad
      const numeroCarreras = await this.carrerasService.getCarrerasCountByFacultad(facultad.id);
      
      // Buscar el decano real de la facultad
      const decano = await this.findDecanoByFacultadId(facultad.id);

      return {
        id: facultad.id,
        codigo: facultad.codigo,
        nombre: facultad.nombre,
        descripcion: facultad.descripcion,
        numeroCarreras,
        decano,
        estadoActivo: facultad.estadoActivo,
        createdAt: facultad.createdAt,
        updatedAt: facultad.updatedAt,
      };
    }));
  }

  // Método auxiliar para encontrar el decano de una facultad
  private async findDecanoByFacultadId(facultadId: number): Promise<{ id: number; nombres: string; apellidos: string; correo: string; } | null> {
    // Buscar el decano específico de esta facultad usando la relación facultadId
    const decano = await this.usuarioModel.findOne({
      where: { 
        rol: RolEnum.DECANO,
        estadoActivo: true,
        facultadId: facultadId  // Ahora filtramos por la facultad específica
      },
      attributes: ['id', 'nombres', 'apellidos', 'correo'],
    });
    
    return decano ? {
      id: decano.id,
      nombres: decano.nombres,
      apellidos: decano.apellidos,
      correo: decano.correo,
    } : null;
  }

  // Método para administradores con filtros avanzados y paginación
  async findAllForAdminPaginated(filterDto?: FilterFacultadDto): Promise<PaginatedFacultadResponseDto> {
    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 10;
    const offset = (page - 1) * limit;

    // Construir whereClause base
    const whereClause: any = {};
    
    if (filterDto?.estadoActivo !== undefined) {
      whereClause.estadoActivo = filterDto.estadoActivo;
    }

    if (filterDto?.search) {
      whereClause[Op.or] = [
        { codigo: { [Op.iLike]: `%${filterDto.search}%` } },
        { nombre: { [Op.iLike]: `%${filterDto.search}%` } },
      ];
    }

    // Obtener facultades con paginación
    const { rows: facultades, count: total } = await this.facultadModel.findAndCountAll({
      where: whereClause,
      order: [['nombre', 'ASC']],
      limit,
      offset,
    });

    // Transformar los datos y aplicar filtro por número de carreras
    const facultadesCompletas: FacultadListResponseDto[] = [];
    
    for (const facultad of facultades) {
      // Contar carreras reales por facultad
      const numeroCarreras = await this.carrerasService.getCarrerasCountByFacultad(facultad.id);
      
      // Aplicar filtro por número de carreras si está especificado
      if (filterDto?.numeroCarrerasMin !== undefined && numeroCarreras < filterDto.numeroCarrerasMin) {
        continue;
      }
      if (filterDto?.numeroCarrerasMax !== undefined && numeroCarreras > filterDto.numeroCarrerasMax) {
        continue;
      }
      
      // Buscar el decano real de la facultad
      const decano = await this.findDecanoByFacultadId(facultad.id);

      facultadesCompletas.push({
        id: facultad.id,
        codigo: facultad.codigo,
        nombre: facultad.nombre,
        descripcion: facultad.descripcion,
        numeroCarreras,
        decano,
        estadoActivo: facultad.estadoActivo,
        createdAt: facultad.createdAt,
        updatedAt: facultad.updatedAt,
      });
    }

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    const startIndex = facultadesCompletas.length > 0 ? offset + 1 : 0;
    const endIndex = startIndex + facultadesCompletas.length - 1;

    return {
      data: facultadesCompletas,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
      meta: {
        startIndex,
        endIndex,
        hasData: facultadesCompletas.length > 0,
      },
    };
  }

  async findOne(id: number): Promise<FacultadModel> {
    const facultad = await this.facultadModel.findByPk(id);
    if (!facultad) {
      throw new NotFoundException(`Facultad con ID ${id} no encontrada`);
    }
    return facultad;
  }

  async findByCode(codigo: string): Promise<FacultadModel | null> {
    return this.facultadModel.findOne({
      where: { codigo },
    });
  }

  async update(id: number, updateFacultadDto: UpdateFacultadDto): Promise<FacultadModel> {
    const facultad = await this.findOne(id);
    
    // Verificar código único si se está actualizando
    if (updateFacultadDto.codigo && updateFacultadDto.codigo !== facultad.codigo) {
      const existingFacultad = await this.findByCode(updateFacultadDto.codigo);
      if (existingFacultad) {
        throw new BadRequestException('Ya existe una facultad con este código');
      }
    }

    // Verificar nombre único si se está actualizando
    if (updateFacultadDto.nombre && updateFacultadDto.nombre !== facultad.nombre) {
      const existingFacultad = await this.facultadModel.findOne({
        where: { nombre: updateFacultadDto.nombre }
      });
      if (existingFacultad) {
        throw new BadRequestException('Ya existe una facultad con este nombre');
      }
    }
    
    try {
      await facultad.update(updateFacultadDto);
      return facultad;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictException('Error de duplicación: El código o nombre ya están registrados');
      }
      throw new BadRequestException('Error al actualizar la facultad: ' + error.message);
    }
  }

  async remove(id: number): Promise<void> {
    const facultad = await this.findOne(id);
    
    // TODO: Verificar si la facultad tiene carreras asociadas
    // Esta lógica se implementará cuando se cree el modelo de Carreras
    // const carrerasAsociadas = await this.carrerasService.countByFacultadId(id);
    // if (carrerasAsociadas > 0) {
    //   throw new ConflictException('No se puede eliminar la facultad porque tiene carreras asociadas');
    // }

    // Por ahora solo hacer soft delete
    await facultad.update({ estadoActivo: false });
  }

  async restore(id: number): Promise<FacultadModel> {
    const facultad = await this.findOne(id);
    await facultad.update({ estadoActivo: true });
    return facultad;
  }

  async hardDelete(id: number): Promise<void> {
    const facultad = await this.findOne(id);
    
    // TODO: Verificar dependencias antes de eliminar definitivamente
    // Esta verificación se implementará cuando se tenga el modelo de Carreras
    
    await facultad.destroy();
  }
}