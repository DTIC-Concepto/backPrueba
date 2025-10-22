import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AsignaturasService } from './asignaturas.service';
import { AsignaturaModel } from './models/asignatura.model';
import { CarreraModel } from '../carreras/models/carrera.model';
import { CarreraAsignaturaModel } from './models/carrera-asignatura.model';
import { TipoAsignaturaEnum } from '../common/enums/tipo-asignatura.enum';
import { UnidadCurricularEnum } from '../common/enums/unidad-curricular.enum';
import { Sequelize } from 'sequelize-typescript';

describe('AsignaturasService', () => {
  let service: AsignaturasService;
  let asignaturaModel: typeof AsignaturaModel;
  let carreraModel: typeof CarreraModel;
  let carreraAsignaturaModel: typeof CarreraAsignaturaModel;
  let sequelize: Sequelize;

  const mockSequelize = {
    transaction: jest.fn().mockResolvedValue({
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    }),
  };

  const mockAsignaturaModel = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  };

  const mockCarreraModel = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
  };

  const mockCarreraAsignaturaModel = {
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
  };

  const mockAsignatura = {
    id: 1,
    codigo: 'ISWD414',
    nombre: 'Ingeniería de Software y Requerimientos',
    creditos: 3,
    descripcion: 'Asignatura de prueba',
    tipoAsignatura: TipoAsignaturaEnum.OBLIGATORIA,
    unidadCurricular: UnidadCurricularEnum.UNIDAD_PROFESIONAL,
    pensum: 2023,
    nivelReferencial: 1,
    estadoActivo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    carreras: [],
    update: jest.fn(),
    destroy: jest.fn(),
    restore: jest.fn(),
  };

  const mockCarrera = {
    id: 1,
    codigo: 'ING-SIS',
    nombre: 'Ingeniería en Sistemas',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsignaturasService,
        {
          provide: getModelToken(AsignaturaModel),
          useValue: mockAsignaturaModel,
        },
        {
          provide: getModelToken(CarreraModel),
          useValue: mockCarreraModel,
        },
        {
          provide: getModelToken(CarreraAsignaturaModel),
          useValue: mockCarreraAsignaturaModel,
        },
        {
          provide: Sequelize,
          useValue: mockSequelize,
        },
      ],
    }).compile();

    service = module.get<AsignaturasService>(AsignaturasService);
    asignaturaModel = module.get(getModelToken(AsignaturaModel));
    carreraModel = module.get(getModelToken(CarreraModel));
    carreraAsignaturaModel = module.get(getModelToken(CarreraAsignaturaModel));
    sequelize = module.get(Sequelize);

    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      codigo: 'ISWD414',
      nombre: 'Ingeniería de Software y Requerimientos',
      creditos: 3,
      descripcion: 'Asignatura de prueba',
      tipoAsignatura: TipoAsignaturaEnum.OBLIGATORIA,
      unidadCurricular: UnidadCurricularEnum.UNIDAD_PROFESIONAL,
      pensum: 2023,
      nivelReferencial: 1,
      carreraIds: [1],
      estadoActivo: true,
    };

    it('debería crear una asignatura exitosamente', async () => {
      mockAsignaturaModel.findOne.mockResolvedValue(null);
      mockCarreraModel.findAll.mockResolvedValue([mockCarrera]);
      mockAsignaturaModel.create.mockResolvedValue(mockAsignatura);
      mockCarreraAsignaturaModel.bulkCreate.mockResolvedValue([]);

      jest.spyOn(service, 'findOne').mockResolvedValue(mockAsignatura as any);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockAsignaturaModel.findOne).toHaveBeenCalled();
      expect(mockCarreraModel.findAll).toHaveBeenCalled();
      expect(mockAsignaturaModel.create).toHaveBeenCalled();
      expect(mockCarreraAsignaturaModel.bulkCreate).toHaveBeenCalled();
    });

    it('debería lanzar BadRequestException si el código ya existe', async () => {
      mockAsignaturaModel.findOne.mockResolvedValue(mockAsignatura);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      expect(mockAsignaturaModel.findOne).toHaveBeenCalled();
    });

    it('debería lanzar BadRequestException si una carrera no existe', async () => {
      mockAsignaturaModel.findOne.mockResolvedValue(null);
      mockCarreraModel.findAll.mockResolvedValue([]);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      expect(mockCarreraModel.findAll).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('debería retornar todas las asignaturas sin filtros', async () => {
      const asignaturas = [mockAsignatura];
      mockAsignaturaModel.findAll.mockResolvedValue(asignaturas);

      const result = await service.findAll();

      expect(result).toEqual(asignaturas);
      expect(mockAsignaturaModel.findAll).toHaveBeenCalled();
    });

    it('debería filtrar asignaturas por búsqueda (código, nombre o descripción)', async () => {
      const asignaturas = [mockAsignatura];
      mockAsignaturaModel.findAll.mockResolvedValue(asignaturas);

      const result = await service.findAll({ search: 'Software' });

      expect(result).toEqual(asignaturas);
      // Solo verificamos que se haya llamado con un objeto que tenga 'where' (sin importar el símbolo)
      expect(mockAsignaturaModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.any(Object) })
      );
    });

    it('debería filtrar asignaturas por carreraId', async () => {
      const asignaturas = [mockAsignatura];
      mockAsignaturaModel.findAll.mockResolvedValue(asignaturas);

      const result = await service.findAll({ carreraId: 1 });

      expect(result).toEqual(asignaturas);
      expect(mockAsignaturaModel.findAll).toHaveBeenCalled();
    });

    it('debería filtrar asignaturas por nivel referencial', async () => {
      const asignaturas = [mockAsignatura];
      mockAsignaturaModel.findAll.mockResolvedValue(asignaturas);

      const result = await service.findAll({ nivelReferencial: 1 });

      expect(result).toEqual(asignaturas);
      expect(mockAsignaturaModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            nivelReferencial: 1,
          }),
        }),
      );
    });

    it('debería filtrar asignaturas por créditos', async () => {
      const asignaturas = [mockAsignatura];
      mockAsignaturaModel.findAll.mockResolvedValue(asignaturas);

      const result = await service.findAll({ creditos: 3 });

      expect(result).toEqual(asignaturas);
      expect(mockAsignaturaModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            creditos: 3,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('debería retornar una asignatura por ID', async () => {
      mockAsignaturaModel.findByPk.mockResolvedValue(mockAsignatura);

      const result = await service.findOne(1);

      expect(result).toEqual(mockAsignatura);
      expect(mockAsignaturaModel.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('debería lanzar NotFoundException si no se encuentra la asignatura', async () => {
      mockAsignaturaModel.findByPk.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCodigo', () => {
    it('debería retornar una asignatura por código', async () => {
      mockAsignaturaModel.findOne.mockResolvedValue(mockAsignatura);

      const result = await service.findByCodigo('ISWD414');

      expect(result).toEqual(mockAsignatura);
      expect(mockAsignaturaModel.findOne).toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si no se encuentra la asignatura', async () => {
      mockAsignaturaModel.findOne.mockResolvedValue(null);

      await expect(service.findByCodigo('INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCarrera', () => {
    it('debería retornar asignaturas de una carrera específica', async () => {
      mockCarreraModel.findByPk.mockResolvedValue(mockCarrera);
      mockAsignaturaModel.findAll.mockResolvedValue([mockAsignatura]);

      const result = await service.findByCarrera(1);

      expect(result).toEqual([mockAsignatura]);
      expect(mockCarreraModel.findByPk).toHaveBeenCalledWith(1);
      expect(mockAsignaturaModel.findAll).toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si la carrera no existe', async () => {
      mockCarreraModel.findByPk.mockResolvedValue(null);

      await expect(service.findByCarrera(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      nombre: 'Nombre actualizado',
    };

    it('debería actualizar una asignatura', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAsignatura as any);
      mockAsignatura.update.mockResolvedValue(mockAsignatura);

      const result = await service.update(1, updateDto);

      expect(result).toBeDefined();
      expect(mockAsignatura.update).toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si la asignatura no existe', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('debería eliminar una asignatura (soft delete)', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAsignatura as any);
      mockAsignatura.destroy.mockResolvedValue(undefined);
      mockCarreraAsignaturaModel.destroy.mockResolvedValue(1);

      await service.remove(1);

      expect(mockCarreraAsignaturaModel.destroy).toHaveBeenCalled();
      expect(mockAsignatura.destroy).toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si la asignatura no existe', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore', () => {
    it('debería restaurar una asignatura eliminada', async () => {
      const deletedAsignatura = { ...mockAsignatura, deletedAt: new Date() };
      mockAsignaturaModel.findByPk.mockResolvedValue(deletedAsignatura);
      deletedAsignatura.restore.mockResolvedValue(mockAsignatura);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAsignatura as any);

      const result = await service.restore(1);

      expect(result).toBeDefined();
      expect(deletedAsignatura.restore).toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si la asignatura no existe', async () => {
      mockAsignaturaModel.findByPk.mockResolvedValue(null);

      await expect(service.restore(999)).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar BadRequestException si la asignatura no está eliminada', async () => {
      mockAsignaturaModel.findByPk.mockResolvedValue(mockAsignatura);

      await expect(service.restore(1)).rejects.toThrow(BadRequestException);
    });
  });
});
