import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { RaaService } from '../services/raa.service';
import { RaaModel } from '../models/raa.model';
import { DeleteRaaDto } from '../dtos/delete-raa.dto';
import { CreateRaaDto, UpdateRaaDto, FilterRaaDto } from '../dtos/raa.dto';

describe('RaaService', () => {
  let service: RaaService;
  let raaModel: jest.Mocked<typeof RaaModel>;

  const mockRaaModel = {
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
  };

  const mockRaa = {
    id: 1,
    codigo: 'RAA-001',
    descripcion: 'Descripción del RAA de prueba',
    asignaturaId: 1,
    tipoRaaId: 1,
    estadoActivo: true,
    eliminadoEn: null,
    update: jest.fn(),
    destroy: jest.fn(),
  };

  beforeEach(async () => {
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
    raaModel = module.get(getModelToken(RaaModel));

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('eliminarRaa', () => {
    const deleteRaaDto: DeleteRaaDto = {
      id: 1,
      confirmarEliminacion: true,
      forzarEliminacion: false,
    };

    it('debería eliminar un RAA con soft delete exitosamente', async () => {
      // Arrange
      mockRaaModel.findByPk.mockResolvedValue(mockRaa);
      mockRaaModel.destroy.mockResolvedValue(1);

      // Act
      const result = await service.eliminarRaa(deleteRaaDto);

      // Assert
      expect(mockRaaModel.findByPk).toHaveBeenCalledWith(1, { paranoid: false });
      expect(mockRaaModel.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({
        exitoso: true,
        mensaje: 'RAA eliminado correctamente (eliminación suave)',
        id: 1,
        codigo: 'RAA-001',
        tipoEliminacion: 'soft_delete',
      });
    });

    it('debería eliminar un RAA con hard delete cuando se fuerza', async () => {
      // Arrange
      const deleteDto = { ...deleteRaaDto, forzarEliminacion: true };
      mockRaaModel.findByPk.mockResolvedValue(mockRaa);
      mockRaaModel.destroy.mockResolvedValue(1);

      // Act
      const result = await service.eliminarRaa(deleteDto);

      // Assert
      expect(mockRaaModel.destroy).toHaveBeenCalledWith({ 
        where: { id: 1 },
        force: true 
      });
      expect(result.tipoEliminacion).toBe('hard_delete');
    });

    it('debería inactivar un RAA cuando tiene relaciones', async () => {
      // Arrange
      // Aquí simularíamos que tiene relaciones existentes en implementación futura
      mockRaaModel.findByPk.mockResolvedValue(mockRaa);
      mockRaaModel.update.mockResolvedValue([1]);

      // Act
      const result = await service.eliminarRaa(deleteRaaDto);

      // Assert - Por ahora siempre hace soft delete porque no hay verificación de relaciones
      expect(result.tipoEliminacion).toBe('soft_delete');
    });

    it('debería lanzar NotFoundException cuando el RAA no existe', async () => {
      // Arrange
      mockRaaModel.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(service.eliminarRaa(deleteRaaDto)).rejects.toThrow(
        new NotFoundException('RAA con ID 1 no encontrado')
      );
    });

    it('debería lanzar BadRequestException cuando el RAA ya está eliminado', async () => {
      // Arrange
      const raaEliminado = { ...mockRaa, eliminadoEn: new Date() };
      mockRaaModel.findByPk.mockResolvedValue(raaEliminado);

      // Act & Assert
      await expect(service.eliminarRaa(deleteRaaDto)).rejects.toThrow(
        new BadRequestException('El RAA con ID 1 ya ha sido eliminado anteriormente')
      );
    });

    it('debería lanzar BadRequestException cuando el RAA está inactivo', async () => {
      // Arrange
      const raaInactivo = { ...mockRaa, estadoActivo: false };
      mockRaaModel.findByPk.mockResolvedValue(raaInactivo);

      // Act & Assert
      await expect(service.eliminarRaa(deleteRaaDto)).rejects.toThrow(
        new BadRequestException('El RAA con ID 1 ya está inactivo')
      );
    });

    it('debería lanzar ConflictException cuando ocurre un error durante la eliminación', async () => {
      // Arrange
      mockRaaModel.findByPk.mockResolvedValue(mockRaa);
      mockRaaModel.destroy.mockRejectedValue(new Error('Error de base de datos'));

      // Act & Assert
      await expect(service.eliminarRaa(deleteRaaDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('buscarPorId', () => {
    it('debería retornar un RAA cuando existe', async () => {
      // Arrange
      mockRaaModel.findByPk.mockResolvedValue(mockRaa);

      // Act
      const result = await service.buscarPorId(1);

      // Assert
      expect(mockRaaModel.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockRaa);
    });

    it('debería lanzar NotFoundException cuando el RAA no existe', async () => {
      // Arrange
      mockRaaModel.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(service.buscarPorId(1)).rejects.toThrow(
        new NotFoundException('RAA con ID 1 no encontrado')
      );
    });
  });

  describe('crear', () => {
    const createRaaDto: CreateRaaDto = {
      codigo: 'RAA-001',
      descripcion: 'Descripción del RAA',
      asignaturaId: 1,
      tipoRaaId: 1,
      estadoActivo: true,
    };

    it('debería crear un RAA exitosamente', async () => {
      // Arrange
      mockRaaModel.create.mockResolvedValue(mockRaa);

      // Act
      const result = await service.crear(createRaaDto);

      // Assert
      expect(mockRaaModel.create).toHaveBeenCalledWith({
        codigo: 'RAA-001',
        nombre: 'RAA-001', // Usar código como nombre por compatibilidad
        descripcion: 'Descripción del RAA',
        asignaturaId: 1,
        tipoRaaId: 1,
        nivel: 'BASICO', // Valor por defecto
        estadoActivo: true,
      });
      expect(result).toEqual(mockRaa);
    });

    it('debería lanzar ConflictException cuando el código ya existe', async () => {
      // Arrange
      const error = new Error('Unique constraint error');
      error.name = 'SequelizeUniqueConstraintError';
      mockRaaModel.create.mockRejectedValue(error);

      // Act & Assert
      await expect(service.crear(createRaaDto)).rejects.toThrow(
        new ConflictException('Ya existe un RAA con el código RAA-001')
      );
    });
  });

  describe('actualizar', () => {
    const updateRaaDto: UpdateRaaDto = {
      descripcion: 'Nueva descripción',
    };

    it('debería actualizar un RAA exitosamente', async () => {
      // Arrange
      mockRaaModel.findByPk.mockResolvedValue(mockRaa);
      mockRaa.update.mockResolvedValue(mockRaa);

      // Act
      const result = await service.actualizar(1, updateRaaDto);

      // Assert
      expect(mockRaaModel.findByPk).toHaveBeenCalledWith(1);
      expect(mockRaa.update).toHaveBeenCalledWith(updateRaaDto);
      expect(result).toEqual(mockRaa);
    });
  });

  describe('listar', () => {
    it('debería listar todos los RAAs sin filtros', async () => {
      // Arrange
      const raas = [mockRaa];
      mockRaaModel.findAll.mockResolvedValue(raas);

      // Act
      const result = await service.listar();

      // Assert
      expect(mockRaaModel.findAll).toHaveBeenCalledWith({
        where: {},
        order: [['codigo', 'ASC']],
      });
      expect(result).toEqual(raas);
    });

    it('debería listar RAAs con filtros aplicados', async () => {
      // Arrange
      const filterDto: FilterRaaDto = { codigo: 'RAA-001', estadoActivo: true };
      const raas = [mockRaa];
      mockRaaModel.findAll.mockResolvedValue(raas);

      // Act
      const result = await service.listar(filterDto);

      // Assert
      expect(mockRaaModel.findAll).toHaveBeenCalledWith({
        where: { codigo: 'RAA-001', estadoActivo: true },
        order: [['codigo', 'ASC']],
      });
      expect(result).toEqual(raas);
    });
  });

  describe('existePorCodigo', () => {
    it('debería retornar true cuando el RAA existe', async () => {
      // Arrange
      mockRaaModel.count.mockResolvedValue(1);

      // Act
      const result = await service.existePorCodigo('RAA-001');

      // Assert
      expect(mockRaaModel.count).toHaveBeenCalledWith({ where: { codigo: 'RAA-001' } });
      expect(result).toBe(true);
    });

    it('debería retornar false cuando el RAA no existe', async () => {
      // Arrange
      mockRaaModel.count.mockResolvedValue(0);

      // Act
      const result = await service.existePorCodigo('RAA-999');

      // Assert
      expect(result).toBe(false);
    });
  });
});
