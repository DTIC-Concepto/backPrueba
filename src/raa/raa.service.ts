import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { RaaModel } from './models/raa.model';
import { CarreraAsignaturaModel } from '../asignaturas/models/carrera-asignatura.model';
import { AsignaturaModel } from '../asignaturas/models/asignatura.model';
import { CarreraModel } from '../carreras/models/carrera.model';
import { CreateRaaDto } from './dto/create-raa.dto';
import { UpdateRaaDto } from './dto/update-raa.dto';
import { FilterRaaDto } from './dto/filter-raa.dto';

@Injectable()
export class RaaService {
  constructor(
    @InjectModel(RaaModel)
    private raaModel: typeof RaaModel,
    @InjectModel(CarreraAsignaturaModel)
    private carreraAsignaturaModel: typeof CarreraAsignaturaModel,
  ) {}

  async create(createRaaDto: CreateRaaDto): Promise<RaaModel> {
    // Buscar todas las relaciones carrera-asignatura para esta asignatura
    const relacionesCarreraAsignatura = await this.carreraAsignaturaModel.findAll({
      where: {
        asignaturaId: createRaaDto.asignaturaId,
      },
    });

    if (relacionesCarreraAsignatura.length === 0) {
      throw new BadRequestException(
        `No existe ninguna relación carrera-asignatura para la asignatura con ID ${createRaaDto.asignaturaId}`,
      );
    }

    // Crear un RAA para cada relación carrera-asignatura
    const raasCreados: RaaModel[] = [];

    for (const relacion of relacionesCarreraAsignatura) {
      // Validar que el código sea único para esta combinación carrera-asignatura
      const existingRaa = await this.raaModel.findOne({
        where: {
          codigo: createRaaDto.codigo,
          carreraAsignaturaId: relacion.id,
        },
      });

      if (!existingRaa) {
        // Crear el RAA solo si no existe
        const nuevoRaa = await this.raaModel.create({
          codigo: createRaaDto.codigo,
          tipo: createRaaDto.tipo,
          descripcion: createRaaDto.descripcion,
          carreraAsignaturaId: relacion.id,
          estadoActivo: createRaaDto.estadoActivo ?? true,
        } as any);

        raasCreados.push(nuevoRaa);
      }
    }

    if (raasCreados.length === 0) {
      throw new BadRequestException(
        `Ya existe un RAA con el código ${createRaaDto.codigo} para todas las carreras de esta asignatura`,
      );
    }

    // Retornar el primer RAA creado con sus relaciones
    return this.findOne(raasCreados[0].id);
  }

  async findAll(filterDto?: FilterRaaDto): Promise<RaaModel[]> {
    const whereClause: any = {};
    const includeClause: any = [
      {
        model: CarreraAsignaturaModel,
        as: 'carreraAsignatura',
        attributes: ['id', 'carreraId', 'asignaturaId'],
        include: [
          {
            model: AsignaturaModel,
            attributes: ['id', 'codigo', 'nombre'],
          },
          {
            model: CarreraModel,
            attributes: ['id', 'nombre'],
          },
        ],
      },
    ];

    // Filtro por búsqueda en código o descripción
    if (filterDto?.search) {
      whereClause[Op.or] = [
        { codigo: { [Op.iLike]: `%${filterDto.search}%` } },
        { descripcion: { [Op.iLike]: `%${filterDto.search}%` } },
      ];
    }

    // Filtro por carreraAsignaturaId directo
    if (filterDto?.carreraAsignaturaId) {
      whereClause.carreraAsignaturaId = filterDto.carreraAsignaturaId;
    }

    // Filtro por asignaturaId (a través de carreraAsignatura)
    if (filterDto?.asignaturaId && !filterDto?.carreraAsignaturaId) {
      includeClause[0].where = includeClause[0].where || {};
      includeClause[0].where.asignaturaId = filterDto.asignaturaId;
      includeClause[0].required = true;
    }

    // Filtro por carreraId (a través de carreraAsignatura)
    if (filterDto?.carreraId && !filterDto?.carreraAsignaturaId) {
      includeClause[0].where = includeClause[0].where || {};
      includeClause[0].where.carreraId = filterDto.carreraId;
      includeClause[0].required = true;
    }

    // Filtro por tipo
    if (filterDto?.tipo) {
      whereClause.tipo = filterDto.tipo;
    }

    return this.raaModel.findAll({
      where: whereClause,
      include: includeClause,
      order: [
        ['carreraAsignaturaId', 'ASC'],
        ['codigo', 'ASC'],
      ],
    });
  }

  async findOne(id: number): Promise<RaaModel> {
    const raa = await this.raaModel.findByPk(id, {
      include: [
        {
          model: CarreraAsignaturaModel,
          as: 'carreraAsignatura',
          attributes: ['id', 'carreraId', 'asignaturaId'],
          include: [
            {
              model: AsignaturaModel,
              attributes: ['id', 'codigo', 'nombre', 'creditos'],
            },
            {
              model: CarreraModel,
              attributes: ['id', 'nombre', 'codigo'],
            },
          ],
        },
      ],
    });

    if (!raa) {
      throw new NotFoundException(`RAA con ID ${id} no encontrado`);
    }

    return raa;
  }

  async findByCodigo(
    codigo: string,
    carreraAsignaturaId: number,
  ): Promise<RaaModel> {
    const raa = await this.raaModel.findOne({
      where: { codigo, carreraAsignaturaId },
      include: [
        {
          model: CarreraAsignaturaModel,
          as: 'carreraAsignatura',
          attributes: ['id', 'carreraId', 'asignaturaId'],
          include: [
            {
              model: AsignaturaModel,
              attributes: ['id', 'codigo', 'nombre', 'creditos'],
            },
            {
              model: CarreraModel,
              attributes: ['id', 'nombre', 'codigo'],
            },
          ],
        },
      ],
    });

    if (!raa) {
      throw new NotFoundException(`RAA con código ${codigo} no encontrado`);
    }

    return raa;
  }

  async findByCarreraAsignatura(
    carreraAsignaturaId: number,
  ): Promise<RaaModel[]> {
    // Validar que la relación carrera-asignatura existe
    const carreraAsignatura =
      await this.carreraAsignaturaModel.findByPk(carreraAsignaturaId);
    if (!carreraAsignatura) {
      throw new NotFoundException(
        `Relación carrera-asignatura con ID ${carreraAsignaturaId} no encontrada`,
      );
    }

    return this.raaModel.findAll({
      where: { carreraAsignaturaId },
      include: [
        {
          model: CarreraAsignaturaModel,
          as: 'carreraAsignatura',
          attributes: ['id', 'carreraId', 'asignaturaId'],
          include: [
            {
              model: AsignaturaModel,
              attributes: ['id', 'codigo', 'nombre'],
            },
            {
              model: CarreraModel,
              attributes: ['id', 'nombre'],
            },
          ],
        },
      ],
      order: [['codigo', 'ASC']],
    });
  }

  async update(id: number, updateRaaDto: UpdateRaaDto): Promise<RaaModel> {
    const raa = await this.findOne(id);

    // Si se está actualizando el código, validar unicidad para esta carrera-asignatura
    if (updateRaaDto.codigo && updateRaaDto.codigo !== raa.codigo) {
      const existingRaa = await this.raaModel.findOne({
        where: {
          codigo: updateRaaDto.codigo,
          carreraAsignaturaId: raa.carreraAsignaturaId,
          id: { [Op.ne]: id },
        },
      });

      if (existingRaa) {
        throw new BadRequestException(
          `Ya existe un RAA con el código ${updateRaaDto.codigo} para esta carrera-asignatura`,
        );
      }
    }

    // Actualizar el RAA
    await raa.update(updateRaaDto);

    // Retornar el RAA actualizado con sus relaciones
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const raa = await this.findOne(id);
    await raa.destroy();
  }

  // Método para obtener el conteo de RAAs por carrera-asignatura
  async getRaaCountByCarreraAsignatura(
    carreraAsignaturaId: number,
  ): Promise<number> {
    return this.raaModel.count({
      where: {
        carreraAsignaturaId,
        estadoActivo: true,
      },
    });
  }

  // Método para obtener RAAs agrupados por tipo
  async getRaasByTipo(carreraAsignaturaId: number): Promise<any> {
    const raas = await this.findByCarreraAsignatura(carreraAsignaturaId);

    return {
      conocimientos: raas.filter((r) => r.tipo === 'Conocimientos'),
      destrezas: raas.filter((r) => r.tipo === 'Destrezas'),
      valoresActitudes: raas.filter((r) => r.tipo === 'Valores y actitudes'),
    };
  }
}
