import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { RaaService } from '../services/raa.service';
import { RaaModel } from '../models/raa.model';
import { UpdateRaaRequestDto } from '../dtos/update-raa.dto';

describe('RaaService - Actualizar RAA', () => {
  let service: RaaService;
  let mockRaaModel: any;

  const mockRaa = {
    id: 1,
    codigo: 'RAA-001',
    descripcion: 'Descripción original',
    asignaturaId: 1,
    tipoRaaId: 1,
    estadoActivo: true,
    toJSON: jest.fn().mockReturnValue({
      id: 1,
      codigo: 'RAA-001',
      descripcion: 'Descripción original',
      asignaturaId: 1,
      tipoRaaId: 1,
      estadoActivo: true,
    }),
    update: jest.fn(),
    reload: jest.fn(),
  };

  beforeEach(async () => {
    mockRaaModel = {
      findByPk: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RaaService,
        {
          provide: getModelToken(RaaModel),
          useValue: mockRaaModel,
        },
      ],
    }).compile();

    service = module.get<RaaService>(RaaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('actualizarConDetalle', () => {
    it('debería actualizar un RAA exitosamente con detalles', async () => {
      const updateRaaDto: UpdateRaaRequestDto = {
        descripcion: 'Nueva descripción',
        estadoActivo: false,
      };

      mockRaaModel.findByPk.mockResolvedValue(mockRaa);
      mockRaaModel.findOne.mockResolvedValue(null);
      mockRaa.update.mockResolvedValue(undefined);
      mockRaa.reload.mockResolvedValue(undefined);
      mockRaa.toJSON.mockReturnValue({
        ...mockRaa.toJSON(),
        descripcion: 'Nueva descripción',
        estadoActivo: false,
      });

      const result = await service.actualizarConDetalle(1, updateRaaDto);

      expect(mockRaaModel.findByPk).toHaveBeenCalledWith(1);
      expect(mockRaa.update).toHaveBeenCalledWith(updateRaaDto);
      expect(mockRaa.reload).toHaveBeenCalled();
      expect(result.exitoso).toBe(true);
      expect(result.mensaje).toContain('RAA actualizado correctamente');
      expect(result.camposModificados).toEqual(['descripcion', 'estadoActivo']);
      expect(result.valoresAnteriores).toEqual({
        descripcion: 'Descripción original',
        estadoActivo: true,
      });
    });

    it('debería lanzar NotFoundException si el RAA no existe', async () => {
      const updateRaaDto: UpdateRaaRequestDto = {
        descripcion: 'Nueva descripción',
      };

      mockRaaModel.findByPk.mockResolvedValue(null);

      await expect(service.actualizarConDetalle(999, updateRaaDto))
        .rejects
        .toThrow(NotFoundException);

      expect(mockRaaModel.findByPk).toHaveBeenCalledWith(999);
    });

    it('debería lanzar BadRequestException si no hay campos para actualizar', async () => {
      const updateRaaDto: UpdateRaaRequestDto = {};

      mockRaaModel.findByPk.mockResolvedValue(mockRaa);

      await expect(service.actualizarConDetalle(1, updateRaaDto))
        .rejects
        .toThrow(BadRequestException);
    });

    it('debería lanzar ConflictException si el nuevo código ya existe', async () => {
      const updateRaaDto: UpdateRaaRequestDto = {
        codigo: 'RAA-002',
      };

      const existingRaa = { id: 2, codigo: 'RAA-002' };

      mockRaaModel.findByPk.mockResolvedValue(mockRaa);
      mockRaaModel.findOne.mockResolvedValue(existingRaa);

      await expect(service.actualizarConDetalle(1, updateRaaDto))
        .rejects
        .toThrow(ConflictException);

      expect(mockRaaModel.findOne).toHaveBeenCalledWith({
        where: { codigo: 'RAA-002' },
      });
    });

    it('debería permitir actualizar con el mismo código actual', async () => {
      const updateRaaDto: UpdateRaaRequestDto = {
        codigo: 'RAA-001', // Mismo código actual
        descripcion: 'Nueva descripción',
      };

      mockRaaModel.findByPk.mockResolvedValue(mockRaa);
      mockRaa.update.mockResolvedValue(undefined);
      mockRaa.reload.mockResolvedValue(undefined);

      const result = await service.actualizarConDetalle(1, updateRaaDto);

      expect(result.exitoso).toBe(true);
      // No debería buscar por código porque es el mismo
      expect(mockRaaModel.findOne).not.toHaveBeenCalled();
    });

    it('debería retornar mensaje apropiado cuando no hay cambios', async () => {
      const updateRaaDto: UpdateRaaRequestDto = {
        descripcion: 'Descripción original', // Mismo valor
        estadoActivo: true, // Mismo valor
      };

      mockRaaModel.findByPk.mockResolvedValue(mockRaa);

      const result = await service.actualizarConDetalle(1, updateRaaDto);

      expect(result.exitoso).toBe(true);
      expect(result.mensaje).toContain('No se detectaron cambios');
      expect(result.camposModificados).toEqual([]);
      expect(mockRaa.update).not.toHaveBeenCalled();
    });

    it('debería manejar errores de constraint de clave foránea', async () => {
      const updateRaaDto: UpdateRaaRequestDto = {
        asignaturaId: 999, // ID que no existe
      };

      mockRaaModel.findByPk.mockResolvedValue(mockRaa);
      mockRaaModel.findOne.mockResolvedValue(null);
      
      const error = new Error('Foreign key constraint error');
      error.name = 'SequelizeForeignKeyConstraintError';
      mockRaa.update.mockRejectedValue(error);

      await expect(service.actualizarConDetalle(1, updateRaaDto))
        .rejects
        .toThrow(BadRequestException);
    });

    it('debería manejar errores de constraint único', async () => {
      const updateRaaDto: UpdateRaaRequestDto = {
        codigo: 'RAA-DUPLICADO',
      };

      mockRaaModel.findByPk.mockResolvedValue(mockRaa);
      mockRaaModel.findOne.mockResolvedValue(null);
      
      const error = new Error('Unique constraint error');
      error.name = 'SequelizeUniqueConstraintError';
      mockRaa.update.mockRejectedValue(error);

      await expect(service.actualizarConDetalle(1, updateRaaDto))
        .rejects
        .toThrow(ConflictException);
    });

    it('debería actualizar solo los campos especificados', async () => {
      const updateRaaDto: UpdateRaaRequestDto = {
        descripcion: 'Nueva descripción',
        // No se incluye estadoActivo, asignaturaId, etc.
      };

      mockRaaModel.findByPk.mockResolvedValue(mockRaa);
      mockRaa.update.mockResolvedValue(undefined);
      mockRaa.reload.mockResolvedValue(undefined);

      const result = await service.actualizarConDetalle(1, updateRaaDto);

      expect(result.camposModificados).toEqual(['descripcion']);
      expect(result.valoresAnteriores).toEqual({
        descripcion: 'Descripción original',
      });
    });
  });

  describe('actualizar (método simplificado)', () => {
    it('debería actualizar un RAA exitosamente', async () => {
      const updateRaaDto = {
        descripcion: 'Nueva descripción',
      };

      mockRaaModel.findByPk.mockResolvedValue(mockRaa);
      mockRaa.update.mockResolvedValue(undefined);

      const result = await service.actualizar(1, updateRaaDto);

      expect(mockRaaModel.findByPk).toHaveBeenCalledWith(1);
      expect(mockRaa.update).toHaveBeenCalledWith(updateRaaDto);
      expect(result).toBe(mockRaa);
    });

    it('debería lanzar NotFoundException si el RAA no existe', async () => {
      const updateRaaDto = {
        descripcion: 'Nueva descripción',
      };

      mockRaaModel.findByPk.mockResolvedValue(null);

      await expect(service.actualizar(999, updateRaaDto))
        .rejects
        .toThrow(NotFoundException);
    });

    it('debería manejar errores de constraint único', async () => {
      const updateRaaDto = {
        codigo: 'RAA-DUPLICADO',
      };

      mockRaaModel.findByPk.mockResolvedValue(mockRaa);
      
      const error = new Error('Unique constraint error');
      error.name = 'SequelizeUniqueConstraintError';
      mockRaa.update.mockRejectedValue(error);

      await expect(service.actualizar(1, updateRaaDto))
        .rejects
        .toThrow(ConflictException);
    });
  });
});
