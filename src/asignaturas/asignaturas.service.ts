import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { AsignaturaModel } from './models/asignatura.model';
import { CarreraModel } from '../carreras/models/carrera.model';
import { CarreraAsignaturaModel } from './models/carrera-asignatura.model';
import { CreateAsignaturaDto } from './dto/create-asignatura.dto';
import { UpdateAsignaturaDto } from './dto/update-asignatura.dto';
import { FilterAsignaturaDto } from './dto/filter-asignatura.dto';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class AsignaturasService {
  constructor(
    @InjectModel(AsignaturaModel)
    private asignaturaModel: typeof AsignaturaModel,
    @InjectModel(CarreraModel)
    private carreraModel: typeof CarreraModel,
    @InjectModel(CarreraAsignaturaModel)
    private carreraAsignaturaModel: typeof CarreraAsignaturaModel,
    private sequelize: Sequelize,
  ) {}

  async create(createAsignaturaDto: CreateAsignaturaDto): Promise<AsignaturaModel> {
    // Validar que el código sea único
    const existingAsignatura = await this.asignaturaModel.findOne({
      where: { codigo: createAsignaturaDto.codigo },
      paranoid: false, // Incluir registros eliminados (soft delete)
    });

    if (existingAsignatura) {
      if (existingAsignatura.deletedAt) {
        throw new BadRequestException(
          `Ya existe una asignatura eliminada con el código ${createAsignaturaDto.codigo}. Contacte al administrador para restaurarla.`,
        );
      }
      throw new BadRequestException(
        `Ya existe una asignatura con el código ${createAsignaturaDto.codigo}`,
      );
    }

    // Validar que todas las carreras existen
    const carreras = await this.carreraModel.findAll({
      where: {
        id: { [Op.in]: createAsignaturaDto.carreraIds },
      },
    });

    if (carreras.length !== createAsignaturaDto.carreraIds.length) {
      const carrerasEncontradas = carreras.map((c) => c.id);
      const carrerasNoEncontradas = createAsignaturaDto.carreraIds.filter(
        (id) => !carrerasEncontradas.includes(id),
      );
      throw new BadRequestException(
        `Las siguientes carreras no existen: ${carrerasNoEncontradas.join(', ')}`,
      );
    }

    // Usar transacción para asegurar consistencia
    const transaction: Transaction = await this.sequelize.transaction();

    try {
      // Crear la asignatura
      const nuevaAsignatura = await this.asignaturaModel.create(
        {
          codigo: createAsignaturaDto.codigo,
          nombre: createAsignaturaDto.nombre,
          creditos: createAsignaturaDto.creditos,
          descripcion: createAsignaturaDto.descripcion,
          tipoAsignatura: createAsignaturaDto.tipoAsignatura,
          unidadCurricular: createAsignaturaDto.unidadCurricular,
          pensum: createAsignaturaDto.pensum,
          nivelReferencial: createAsignaturaDto.nivelReferencial,
          estadoActivo: createAsignaturaDto.estadoActivo ?? true,
        } as any,
        { transaction },
      );

      // Crear las relaciones con las carreras
      const relacionesCarrera = createAsignaturaDto.carreraIds.map((carreraId) => ({
        asignaturaId: nuevaAsignatura.id,
        carreraId: carreraId,
      }));

      await this.carreraAsignaturaModel.bulkCreate(relacionesCarrera as any, {
        transaction,
      });

      // Confirmar la transacción
      await transaction.commit();

      // Retornar la asignatura creada con sus relaciones
      return this.findOne(nuevaAsignatura.id);
    } catch (error) {
      // Revertir la transacción en caso de error
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(filterDto?: FilterAsignaturaDto): Promise<AsignaturaModel[]> {
    const whereClause: any = {};
    const includeCarrera: any = {
      model: CarreraModel,
      as: 'carreras',
      attributes: ['id', 'codigo', 'nombre'],
      through: { attributes: [] },
    };

    // Filtro por búsqueda en código o descripción
    if (filterDto?.search) {
      whereClause[Op.or] = [
        { codigo: { [Op.iLike]: `%${filterDto.search}%` } },
        { descripcion: { [Op.iLike]: `%${filterDto.search}%` } },
        { nombre: { [Op.iLike]: `%${filterDto.search}%` } },
      ];
    }

    // Filtro por nivel referencial
    if (filterDto?.nivelReferencial) {
      whereClause.nivelReferencial = filterDto.nivelReferencial;
    }

    // Filtro por créditos
    if (filterDto?.creditos) {
      whereClause.creditos = filterDto.creditos;
    }

    // Filtro por tipo de asignatura
    if (filterDto?.tipoAsignatura) {
      whereClause.tipoAsignatura = filterDto.tipoAsignatura;
    }

    // Filtro por unidad curricular
    if (filterDto?.unidadCurricular) {
      whereClause.unidadCurricular = filterDto.unidadCurricular;
    }

    // Filtro por pénsum
    if (filterDto?.pensum) {
      whereClause.pensum = filterDto.pensum;
    }

    // Filtro por carrera
    if (filterDto?.carreraId) {
      includeCarrera.where = { id: filterDto.carreraId };
      includeCarrera.required = true; // INNER JOIN para filtrar solo asignaturas de esa carrera
    }

    return this.asignaturaModel.findAll({
      where: whereClause,
      include: [includeCarrera],
      order: [
        ['nivelReferencial', 'ASC'],
        ['nombre', 'ASC'],
      ],
    });
  }

  async findOne(id: number): Promise<AsignaturaModel> {
    const asignatura = await this.asignaturaModel.findByPk(id, {
      include: [
        {
          model: CarreraModel,
          as: 'carreras',
          attributes: ['id', 'codigo', 'nombre'],
          through: { attributes: [] },
        },
      ],
    });

    if (!asignatura) {
      throw new NotFoundException(`Asignatura con ID ${id} no encontrada`);
    }

    return asignatura;
  }

  async findByCodigo(codigo: string): Promise<AsignaturaModel> {
    const asignatura = await this.asignaturaModel.findOne({
      where: { codigo },
      include: [
        {
          model: CarreraModel,
          as: 'carreras',
          attributes: ['id', 'codigo', 'nombre'],
          through: { attributes: [] },
        },
      ],
    });

    if (!asignatura) {
      throw new NotFoundException(`Asignatura con código ${codigo} no encontrada`);
    }

    return asignatura;
  }

  async findByCarrera(carreraId: number): Promise<AsignaturaModel[]> {
    // Validar que la carrera existe
    const carrera = await this.carreraModel.findByPk(carreraId);
    if (!carrera) {
      throw new NotFoundException(`Carrera con ID ${carreraId} no encontrada`);
    }

    return this.asignaturaModel.findAll({
      include: [
        {
          model: CarreraModel,
          as: 'carreras',
          where: { id: carreraId },
          attributes: ['id', 'codigo', 'nombre'],
          through: { attributes: [] },
        },
      ],
      order: [['nivelReferencial', 'ASC'], ['nombre', 'ASC']],
    });
  }

  async update(
    id: number,
    updateAsignaturaDto: UpdateAsignaturaDto,
  ): Promise<AsignaturaModel> {
    const asignatura = await this.findOne(id);

    // Si se está actualizando el código, validar unicidad
    if (updateAsignaturaDto.codigo && updateAsignaturaDto.codigo !== asignatura.codigo) {
      const existingAsignatura = await this.asignaturaModel.findOne({
        where: {
          codigo: updateAsignaturaDto.codigo,
          id: { [Op.ne]: id },
        },
        paranoid: false,
      });

      if (existingAsignatura) {
        throw new BadRequestException(
          `Ya existe una asignatura con el código ${updateAsignaturaDto.codigo}`,
        );
      }
    }

    // Usar transacción para asegurar consistencia
    const transaction: Transaction = await this.sequelize.transaction();

    try {
      // Actualizar la asignatura
      await asignatura.update(updateAsignaturaDto, { transaction });

      // Si se están actualizando las carreras
      if (updateAsignaturaDto.carreraIds && updateAsignaturaDto.carreraIds.length > 0) {
        // Validar que todas las carreras existen
        const carreras = await this.carreraModel.findAll({
          where: {
            id: { [Op.in]: updateAsignaturaDto.carreraIds },
          },
        });

        if (carreras.length !== updateAsignaturaDto.carreraIds.length) {
          const carrerasEncontradas = carreras.map((c) => c.id);
          const carrerasNoEncontradas = updateAsignaturaDto.carreraIds.filter(
            (carreraId) => !carrerasEncontradas.includes(carreraId),
          );
          throw new BadRequestException(
            `Las siguientes carreras no existen: ${carrerasNoEncontradas.join(', ')}`,
          );
        }

        // Eliminar las relaciones existentes
        await this.carreraAsignaturaModel.destroy({
          where: { asignaturaId: id },
          transaction,
        });

        // Crear las nuevas relaciones
        const nuevasRelaciones = updateAsignaturaDto.carreraIds.map((carreraId) => ({
          asignaturaId: id,
          carreraId: carreraId,
        }));

        await this.carreraAsignaturaModel.bulkCreate(nuevasRelaciones as any, {
          transaction,
        });
      }

      // Confirmar la transacción
      await transaction.commit();

      // Retornar la asignatura actualizada con sus relaciones
      return this.findOne(id);
    } catch (error) {
      // Revertir la transacción en caso de error
      await transaction.rollback();
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const asignatura = await this.findOne(id);
    
    // Usar transacción para asegurar consistencia
    const transaction: Transaction = await this.sequelize.transaction();

    try {
      // Eliminar las relaciones con carreras
      await this.carreraAsignaturaModel.destroy({
        where: { asignaturaId: id },
        transaction,
      });

      // Soft delete de la asignatura
      await asignatura.destroy({ transaction });

      // Confirmar la transacción
      await transaction.commit();
    } catch (error) {
      // Revertir la transacción en caso de error
      await transaction.rollback();
      throw error;
    }
  }

  // Método para restaurar una asignatura eliminada (soft delete)
  async restore(id: number): Promise<AsignaturaModel> {
    const asignatura = await this.asignaturaModel.findByPk(id, {
      paranoid: false,
    });

    if (!asignatura) {
      throw new NotFoundException(`Asignatura con ID ${id} no encontrada`);
    }

    if (!asignatura.deletedAt) {
      throw new BadRequestException('La asignatura no está eliminada');
    }

    await asignatura.restore();
    return this.findOne(id);
  }

  // Método para obtener el ID de la relación carrera-asignatura
  async getCarreraAsignaturaId(
    carreraId: number,
    asignaturaId: number,
  ): Promise<{ id: number; carreraId: number; asignaturaId: number }> {
    const relacion = await this.carreraAsignaturaModel.findOne({
      where: {
        carreraId,
        asignaturaId,
      },
      attributes: ['id', 'carreraId', 'asignaturaId'],
    });

    if (!relacion) {
      throw new NotFoundException(
        `No existe una relación entre la carrera ${carreraId} y la asignatura ${asignaturaId}`,
      );
    }

    return {
      id: relacion.id,
      carreraId: relacion.carreraId,
      asignaturaId: relacion.asignaturaId,
    };
  }
}
