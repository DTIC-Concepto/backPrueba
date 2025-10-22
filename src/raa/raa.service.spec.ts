import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RaaService } from './raa.service';
import { RaaModel } from './models/raa.model';
import { CarreraAsignaturaModel } from '../asignaturas/models/carrera-asignatura.model';
import { AsignaturaModel } from '../asignaturas/models/asignatura.model';
import { CarreraModel } from '../carreras/models/carrera.model';
import { TipoRaaEnum } from '../common/enums/tipo-raa.enum';

describe('RaaService', () => {
  let service: RaaService;
  let raaModel: typeof RaaModel;
  let carreraAsignaturaModel: typeof CarreraAsignaturaModel;

  const mockRaa = {
    id: 1,
    codigo: '1.1',
    tipo: TipoRaaEnum.CONOCIMIENTOS,
    descripcion: 'RAA de prueba',
    carreraAsignaturaId: 2,
    estadoActivo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    update: jest.fn(),
    destroy: jest.fn(),
  };

  const mockCarreraAsignatura = {
    id: 2,
    carreraId: 1,
    asignaturaId: 1,
  };

  const mockRaaModel = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  };

  const mockCarreraAsignaturaModel = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RaaService,
        { provide: getModelToken(RaaModel), useValue: mockRaaModel },
        { provide: getModelToken(CarreraAsignaturaModel), useValue: mockCarreraAsignaturaModel },
      ],
    }).compile();

    service = module.get<RaaService>(RaaService);
    raaModel = module.get(getModelToken(RaaModel));
    carreraAsignaturaModel = module.get(getModelToken(CarreraAsignaturaModel));
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      codigo: '1.1',
      tipo: TipoRaaEnum.CONOCIMIENTOS,
      descripcion: 'RAA de prueba',
      asignaturaId: 1,
    };

    it('debería crear un RAA exitosamente', async () => {
      mockCarreraAsignaturaModel.findAll.mockResolvedValue([mockCarreraAsignatura]);
      mockRaaModel.findOne.mockResolvedValue(null);
      mockRaaModel.create.mockResolvedValue(mockRaa);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockRaa as any);

      const result = await service.create(createDto);
      expect(result).toEqual(mockRaa);
      expect(mockCarreraAsignaturaModel.findAll).toHaveBeenCalled();
      expect(mockRaaModel.create).toHaveBeenCalled();
    });

    it('debería lanzar BadRequestException si no hay relaciones carrera-asignatura', async () => {
      mockCarreraAsignaturaModel.findAll.mockResolvedValue([]);
      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar BadRequestException si ya existe el RAA para todas las carreras', async () => {
      mockCarreraAsignaturaModel.findAll.mockResolvedValue([mockCarreraAsignatura]);
      mockRaaModel.findOne.mockResolvedValue(mockRaa);
      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('debería retornar todos los RAAs', async () => {
      mockRaaModel.findAll.mockResolvedValue([mockRaa]);
      const result = await service.findAll();
      expect(result).toEqual([mockRaa]);
      expect(mockRaaModel.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debería retornar un RAA por ID', async () => {
      mockRaaModel.findByPk.mockResolvedValue(mockRaa);
      const result = await service.findOne(1);
      expect(result).toEqual(mockRaa);
      expect(mockRaaModel.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('debería lanzar NotFoundException si no se encuentra el RAA', async () => {
      mockRaaModel.findByPk.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = { descripcion: 'Modificado' };
    it('debería actualizar un RAA', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockRaa as any);
      mockRaa.update.mockResolvedValue(mockRaa);
      const result = await service.update(1, updateDto);
      expect(result).toEqual(mockRaa);
      expect(mockRaa.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debería eliminar un RAA', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockRaa as any);
      mockRaa.destroy.mockResolvedValue(undefined);
      await service.remove(1);
      expect(mockRaa.destroy).toHaveBeenCalled();
    });
  });
});
