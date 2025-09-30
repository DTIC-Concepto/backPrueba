import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { FacultadModel } from './models/facultad.model';
import { CreateFacultadDto } from './dto/create-facultad.dto';
import { UpdateFacultadDto } from './dto/update-facultad.dto';
import { FilterFacultadDto } from './dto/filter-facultad.dto';

@Injectable()
export class FacultadesService {
  constructor(
    @InjectModel(FacultadModel)
    private readonly facultadModel: typeof FacultadModel,
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