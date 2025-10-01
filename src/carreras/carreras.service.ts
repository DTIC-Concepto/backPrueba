import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { CarreraModel } from './models/carrera.model';
import { FacultadModel } from '../facultades/models/facultad.model';
import { UsuarioModel } from '../usuarios/models/usuario.model';
import { CreateCarreraDto } from './dto/create-carrera.dto';
import { UpdateCarreraDto } from './dto/update-carrera.dto';
import { FilterCarreraDto } from './dto/filter-carrera.dto';
import { RolEnum } from '../common/enums/rol.enum';
import { ModalidadEnum } from '../common/enums/modalidad.enum';

@Injectable()
export class CarrerasService {
  constructor(
    @InjectModel(CarreraModel)
    private carreraModel: typeof CarreraModel,
    @InjectModel(FacultadModel)
    private facultadModel: typeof FacultadModel,
    @InjectModel(UsuarioModel)
    private usuarioModel: typeof UsuarioModel,
  ) {}

  async create(createCarreraDto: CreateCarreraDto): Promise<CarreraModel> {
    // Validar que el código sea único
    const existingCarrera = await this.carreraModel.findOne({
      where: { codigo: createCarreraDto.codigo },
    });

    if (existingCarrera) {
      throw new BadRequestException(
        `Ya existe una carrera con el código ${createCarreraDto.codigo}`,
      );
    }

    // Validar que la facultad existe
    const facultad = await this.facultadModel.findByPk(createCarreraDto.facultadId);
    if (!facultad) {
      throw new BadRequestException(
        `No existe la facultad con ID ${createCarreraDto.facultadId}`,
      );
    }

    // Validar que el coordinador existe
    const coordinador = await this.usuarioModel.findByPk(createCarreraDto.coordinadorId);
    if (!coordinador) {
      throw new BadRequestException(
        `No existe el usuario con ID ${createCarreraDto.coordinadorId}`,
      );
    }

    // Si el usuario es PROFESOR, automáticamente cambiar su rol a COORDINADOR
    if (coordinador.rol === RolEnum.PROFESOR) {
      await coordinador.update({ rol: RolEnum.COORDINADOR });
    }

    // Validar que el coordinador tiene un rol apropiado para coordinar una carrera
    const rolesValidos = [
      RolEnum.PROFESOR, // Permitir profesor, se cambiará a coordinador automáticamente
      RolEnum.COORDINADOR,
      RolEnum.JEFE_DEPARTAMENTO,
      RolEnum.SUBDECANO,
      RolEnum.DECANO,
      RolEnum.ADMINISTRADOR,
    ];

    if (!rolesValidos.includes(coordinador.rol)) {
      throw new BadRequestException(
        `El usuario seleccionado no tiene un rol apropiado para ser coordinador de carrera. Roles válidos: ${rolesValidos.join(', ')}`,
      );
    }

    // Crear la carrera
    const nuevaCarrera = await this.carreraModel.create({
      codigo: createCarreraDto.codigo,
      nombre: createCarreraDto.nombre,
      facultadId: createCarreraDto.facultadId,
      coordinadorId: createCarreraDto.coordinadorId,
      duracion: createCarreraDto.duracion ?? 10,
      modalidad: createCarreraDto.modalidad ?? ModalidadEnum.PRESENCIAL,
      estadoActivo: createCarreraDto.estadoActivo ?? true,
    } as any);

    // Retornar la carrera creada con sus relaciones
    return this.findOne(nuevaCarrera.id);
  }

  async findAll(filterDto?: FilterCarreraDto): Promise<CarreraModel[]> {
    const whereClause: any = {};

    // Filtrar por facultad
    if (filterDto?.facultadId) {
      whereClause.facultadId = filterDto.facultadId;
    }

    // Filtrar por estado activo
    if (filterDto?.estadoActivo !== undefined) {
      whereClause.estadoActivo = filterDto.estadoActivo;
    }

    // Búsqueda por código o nombre
    if (filterDto?.search) {
      whereClause[Op.or] = [
        { codigo: { [Op.iLike]: `%${filterDto.search}%` } },
        { nombre: { [Op.iLike]: `%${filterDto.search}%` } },
      ];
    }

    // Filtrar por modalidad
    if (filterDto?.modalidad) {
      whereClause.modalidad = filterDto.modalidad;
    }

    // Filtrar por duración
    if (filterDto?.duracionMin || filterDto?.duracionMax) {
      whereClause.duracion = {};
      if (filterDto.duracionMin) {
        whereClause.duracion[Op.gte] = filterDto.duracionMin;
      }
      if (filterDto.duracionMax) {
        whereClause.duracion[Op.lte] = filterDto.duracionMax;
      }
    }

    const carreras = await this.carreraModel.findAll({
      where: whereClause,
      include: [
        {
          model: FacultadModel,
          as: 'facultad',
          attributes: ['id', 'codigo', 'nombre'],
        },
        {
          model: UsuarioModel,
          as: 'coordinador',
          attributes: ['id', 'nombres', 'apellidos', 'correo'],
        },
      ],
      order: [['nombre', 'ASC']],
    });

    return carreras;
  }

  async findOne(id: number): Promise<CarreraModel> {
    const carrera = await this.carreraModel.findByPk(id, {
      include: [
        {
          model: FacultadModel,
          as: 'facultad',
          attributes: ['id', 'codigo', 'nombre'],
        },
        {
          model: UsuarioModel,
          as: 'coordinador',
          attributes: ['id', 'nombres', 'apellidos', 'correo'],
        },
      ],
    });

    if (!carrera) {
      throw new NotFoundException(`Carrera con ID ${id} no encontrada`);
    }

    return carrera;
  }

  async update(id: number, updateCarreraDto: UpdateCarreraDto): Promise<CarreraModel> {
    const carrera = await this.findOne(id);

    // Si se está actualizando el código, validar unicidad
    if (updateCarreraDto.codigo && updateCarreraDto.codigo !== carrera.codigo) {
      const existingCarrera = await this.carreraModel.findOne({
        where: { 
          codigo: updateCarreraDto.codigo,
          id: { [Op.ne]: id },
        },
      });

      if (existingCarrera) {
        throw new BadRequestException(
          `Ya existe una carrera con el código ${updateCarreraDto.codigo}`,
        );
      }
    }

    // Si se está actualizando la facultad, validar que existe
    if (updateCarreraDto.facultadId) {
      const facultad = await this.facultadModel.findByPk(updateCarreraDto.facultadId);
      if (!facultad) {
        throw new BadRequestException(
          `No existe la facultad con ID ${updateCarreraDto.facultadId}`,
        );
      }
    }

    // Si se está actualizando el coordinador, validar que existe y tiene rol apropiado
    if (updateCarreraDto.coordinadorId) {
      const coordinador = await this.usuarioModel.findByPk(updateCarreraDto.coordinadorId);
      if (!coordinador) {
        throw new BadRequestException(
          `No existe el usuario con ID ${updateCarreraDto.coordinadorId}`,
        );
      }

      // Si el usuario es PROFESOR, automáticamente cambiar su rol a COORDINADOR
      if (coordinador.rol === RolEnum.PROFESOR) {
        await coordinador.update({ rol: RolEnum.COORDINADOR });
      }

      const rolesValidos = [
        RolEnum.PROFESOR, // Permitir profesor, se cambiará automáticamente
        RolEnum.COORDINADOR,
        RolEnum.JEFE_DEPARTAMENTO,
        RolEnum.SUBDECANO,
        RolEnum.DECANO,
        RolEnum.ADMINISTRADOR,
      ];

      if (!rolesValidos.includes(coordinador.rol)) {
        throw new BadRequestException(
          `El usuario seleccionado no tiene un rol apropiado para ser coordinador de carrera`,
        );
      }
    }

    // Actualizar la carrera
    await carrera.update(updateCarreraDto);

    // Retornar la carrera actualizada con sus relaciones
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const carrera = await this.findOne(id);
    await carrera.destroy();
  }

  // Método para obtener el conteo de carreras por facultad
  async getCarrerasCountByFacultad(facultadId: number): Promise<number> {
    return this.carreraModel.count({
      where: {
        facultadId,
        estadoActivo: true,
      },
    });
  }

  // Método temporal para verificar datos
  async debugCarreras(): Promise<any> {
    const carreras = await this.carreraModel.findAll({
      raw: true,
      limit: 5,
    });
    console.log('🔍 Raw carreras data:', JSON.stringify(carreras, null, 2));
    return carreras;
  }

  // Método para administradores con filtros avanzados y paginación (HU5104-5110)
  async findAllForAdminPaginated(filterDto: any): Promise<any> {
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 10;
    const offset = (page - 1) * limit;

    // Construir cláusula WHERE con todos los filtros
    const whereClause: any = {};

    // HU5110: Filtrar por facultad
    if (filterDto.facultadId) {
      whereClause.facultadId = filterDto.facultadId;
    }

    // HU5106: Filtrar por estado activo
    if (filterDto.estadoActivo !== undefined) {
      whereClause.estadoActivo = filterDto.estadoActivo;
    }

    // HU5105: Búsqueda por código o nombre
    if (filterDto.search) {
      whereClause[Op.or] = [
        { codigo: { [Op.iLike]: `%${filterDto.search}%` } },
        { nombre: { [Op.iLike]: `%${filterDto.search}%` } },
      ];
    }

    // Filtrar por modalidad
    if (filterDto.modalidad) {
      whereClause.modalidad = filterDto.modalidad;
    }

    // Filtrar por duración
    if (filterDto.duracionMin || filterDto.duracionMax) {
      whereClause.duracion = {};
      if (filterDto.duracionMin) {
        whereClause.duracion[Op.gte] = filterDto.duracionMin;
      }
      if (filterDto.duracionMax) {
        whereClause.duracion[Op.lte] = filterDto.duracionMax;
      }
    }

    // HU5109: Consulta con paginación
    console.log('🔍 Ejecutando consulta con whereClause:', JSON.stringify(whereClause, null, 2));
    
    const { rows: carreras, count: total } = await this.carreraModel.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: FacultadModel,
          as: 'facultad',
          attributes: ['id', 'codigo', 'nombre'],
          required: false, // LEFT JOIN para incluir carreras sin facultad
        },
        {
          model: UsuarioModel,
          as: 'coordinador',
          attributes: ['id', 'nombres', 'apellidos', 'correo', 'rol'],
          required: false, // LEFT JOIN para incluir carreras sin coordinador
        },
      ],
      order: [['nombre', 'ASC']],
      limit,
      offset,
      distinct: true, // Para contar correctamente con JOINs
    });

    //console.log('📊 Resultados encontrados:', carreras.length);
    //console.log('🔍 Primera carrera:', JSON.stringify(carreras[0]?.toJSON(), null, 2));

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Construir respuesta
    return {
      data: carreras.map(carrera => {
        const carreraData = carrera.toJSON(); // Convertir a objeto plano
        console.log('🔍 Procesando carrera:', carreraData.id, 'con datos:', JSON.stringify(carreraData, null, 2));
        
        return {
          id: carreraData.id,
          codigo: carreraData.codigo || 'N/A',
          nombre: carreraData.nombre || 'Sin nombre',
          duracion: carreraData.duracion || 10,
          modalidad: carreraData.modalidad || 'PRESENCIAL',
          estadoActivo: carreraData.estadoActivo !== undefined ? carreraData.estadoActivo : true,
          facultad: carreraData.facultad ? {
            id: carreraData.facultad.id,
            codigo: carreraData.facultad.codigo,
            nombre: carreraData.facultad.nombre,
          } : null,
          coordinador: carreraData.coordinador ? {
            id: carreraData.coordinador.id,
            nombres: carreraData.coordinador.nombres,
            apellidos: carreraData.coordinador.apellidos,
            correo: carreraData.coordinador.correo,
            rol: carreraData.coordinador.rol,
          } : null,
          createdAt: carreraData.createdAt,
          updatedAt: carreraData.updatedAt,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        filters: {
          facultadId: filterDto.facultadId,
          estadoActivo: filterDto.estadoActivo,
          search: filterDto.search,
          modalidad: filterDto.modalidad,
          duracionMin: filterDto.duracionMin,
          duracionMax: filterDto.duracionMax,
        },
      },
    };
  }
}