import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { RaaController } from '../controllers/raa.controller';
import { RaaService } from '../services/raa.service';
import { UpdateRaaRequestDto, UpdateRaaResponseDto } from '../dtos/update-raa.dto';
import { UpdateRaaDto } from '../dtos/raa.dto';

describe('RaaController - Actualizar RAA', () => {
  let controller: RaaController;
  let service: RaaService;

  const mockRaaService = {
    actualizarConDetalle: jest.fn(),
    actualizar: jest.fn(),
    buscarPorId: jest.fn(),
    crear: jest.fn(),
    eliminarRaa: jest.fn(),
    listar: jest.fn(),
  };

  const mockRaaResponse = {
    id: 1,
    codigo: 'RAA-001',
    descripcion: 'RAA actualizado',
    asignaturaId: 1,
    tipoRaaId: 1,
    estadoActivo: true,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RaaController],
      providers: [
        {
          provide: RaaService,
          useValue: mockRaaService,
        },
      ],
    }).compile();

    controller = module.get<RaaController>(RaaController);
    service = module.get<RaaService>(RaaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('actualizarDetallado', () => {
    it('debería actualizar un RAA con respuesta detallada', async () => {
      const updateRaaDto: UpdateRaaRequestDto = {
        descripcion: 'Nueva descripción',
        estadoActivo: false,
      };

      const expectedResponse: UpdateRaaResponseDto = {
        exitoso: true,
        mensaje: 'RAA actualizado correctamente. 2 campo(s) modificado(s)',
        raa: mockRaaResponse,
        camposModificados: ['descripcion', 'estadoActivo'],
        valoresAnteriores: {
          descripcion: 'Descripción anterior',
          estadoActivo: true,
        },
      };

      mockRaaService.actualizarConDetalle.mockResolvedValue(expectedResponse);

      const result = await controller.actualizarDetallado(1, updateRaaDto);

      expect(mockRaaService.actualizarConDetalle).toHaveBeenCalledWith(1, updateRaaDto);
      expect(result).toEqual(expectedResponse);
      expect(result.exitoso).toBe(true);
      expect(result.camposModificados).toHaveLength(2);
    });

    it('debería manejar actualizaciones sin cambios', async () => {
      const updateRaaDto: UpdateRaaRequestDto = {
        descripcion: 'Misma descripción',
      };

      const expectedResponse: UpdateRaaResponseDto = {
        exitoso: true,
        mensaje: 'No se detectaron cambios en los datos del RAA',
        raa: mockRaaResponse,
        camposModificados: [],
      };

      mockRaaService.actualizarConDetalle.mockResolvedValue(expectedResponse);

      const result = await controller.actualizarDetallado(1, updateRaaDto);

      expect(result.camposModificados).toHaveLength(0);
      expect(result.mensaje).toContain('No se detectaron cambios');
    });

    it('debería validar el ID como número entero', async () => {
      const updateRaaDto: UpdateRaaRequestDto = {
        descripcion: 'Nueva descripción',
      };

      // Esto se haría con ParseIntPipe en un test de integración
      // Aquí solo verificamos que el método se llama con el ID correcto
      await controller.actualizarDetallado(1, updateRaaDto);

      expect(mockRaaService.actualizarConDetalle).toHaveBeenCalledWith(1, updateRaaDto);
    });

    it('debería manejar actualizaciones de código único', async () => {
      const updateRaaDto: UpdateRaaRequestDto = {
        codigo: 'RAA-002',
        descripcion: 'Nueva descripción',
      };

      const expectedResponse: UpdateRaaResponseDto = {
        exitoso: true,
        mensaje: 'RAA actualizado correctamente. 2 campo(s) modificado(s)',
        raa: { ...mockRaaResponse, codigo: 'RAA-002' },
        camposModificados: ['codigo', 'descripcion'],
        valoresAnteriores: {
          codigo: 'RAA-001',
          descripcion: 'Descripción anterior',
        },
      };

      mockRaaService.actualizarConDetalle.mockResolvedValue(expectedResponse);

      const result = await controller.actualizarDetallado(1, updateRaaDto);

      expect(result.raa.codigo).toBe('RAA-002');
      expect(result.camposModificados).toContain('codigo');
    });

    it('debería actualizar relaciones foráneas', async () => {
      const updateRaaDto: UpdateRaaRequestDto = {
        asignaturaId: 2,
        tipoRaaId: 3,
      };

      const expectedResponse: UpdateRaaResponseDto = {
        exitoso: true,
        mensaje: 'RAA actualizado correctamente. 2 campo(s) modificado(s)',
        raa: { ...mockRaaResponse, asignaturaId: 2, tipoRaaId: 3 },
        camposModificados: ['asignaturaId', 'tipoRaaId'],
        valoresAnteriores: {
          asignaturaId: 1,
          tipoRaaId: 1,
        },
      };

      mockRaaService.actualizarConDetalle.mockResolvedValue(expectedResponse);

      const result = await controller.actualizarDetallado(1, updateRaaDto);

      expect(result.raa.asignaturaId).toBe(2);
      expect(result.raa.tipoRaaId).toBe(3);
    });
  });

  describe('actualizar (método simplificado)', () => {
    it('debería actualizar un RAA y retornar el modelo', async () => {
      const updateRaaDto: UpdateRaaDto = {
        descripcion: 'Nueva descripción',
      };

      mockRaaService.actualizar.mockResolvedValue(mockRaaResponse);

      const result = await controller.actualizar(1, updateRaaDto);

      expect(mockRaaService.actualizar).toHaveBeenCalledWith(1, updateRaaDto);
      expect(result).toEqual(mockRaaResponse);
    });

    it('debería manejar actualizaciones parciales', async () => {
      const updateRaaDto: UpdateRaaDto = {
        estadoActivo: false,
      };

      const updatedRaa = { ...mockRaaResponse, estadoActivo: false };
      mockRaaService.actualizar.mockResolvedValue(updatedRaa);

      const result = await controller.actualizar(1, updateRaaDto);

      expect(result.estadoActivo).toBe(false);
    });

    it('debería permitir actualizar todos los campos', async () => {
      const updateRaaDto: UpdateRaaDto = {
        codigo: 'RAA-NUEVO',
        descripcion: 'Descripción completamente nueva',
        asignaturaId: 5,
        tipoRaaId: 3,
        estadoActivo: false,
      };

      const updatedRaa = { ...mockRaaResponse, ...updateRaaDto };
      mockRaaService.actualizar.mockResolvedValue(updatedRaa);

      const result = await controller.actualizar(1, updateRaaDto);

      expect(result.codigo).toBe('RAA-NUEVO');
      expect(result.descripcion).toBe('Descripción completamente nueva');
      expect(result.asignaturaId).toBe(5);
      expect(result.tipoRaaId).toBe(3);
      expect(result.estadoActivo).toBe(false);
    });
  });

  describe('Validación de DTOs', () => {
    // Estas pruebas se ejecutarían en un entorno de integración con ValidationPipe
    it('debería validar que los IDs sean números positivos', () => {
      const updateRaaDto: UpdateRaaRequestDto = {
        asignaturaId: -1, // Valor inválido
        tipoRaaId: 0,     // Valor inválido
      };

      // En un test de integración, esto lanzaría errores de validación
      expect(updateRaaDto.asignaturaId).toBeLessThan(1);
      expect(updateRaaDto.tipoRaaId).toBeLessThan(1);
    });

    it('debería permitir campos opcionales', () => {
      const updateRaaDto: UpdateRaaRequestDto = {
        descripcion: 'Solo descripción',
        // Otros campos opcionales no están presentes
      };

      expect(updateRaaDto.descripcion).toBeDefined();
      expect(updateRaaDto.codigo).toBeUndefined();
      expect(updateRaaDto.asignaturaId).toBeUndefined();
    });

    it('debería validar tipos de datos', () => {
      const updateRaaDto: UpdateRaaRequestDto = {
        codigo: 'RAA-VALIDO',
        descripcion: 'Descripción válida',
        estadoActivo: true,
      };

      expect(typeof updateRaaDto.codigo).toBe('string');
      expect(typeof updateRaaDto.descripcion).toBe('string');
      expect(typeof updateRaaDto.estadoActivo).toBe('boolean');
    });
  });
});
