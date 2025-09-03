import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { RaaService } from '../services/raa.service';
import { RaaModel } from '../models/raa.model';
import { ListarRaasQueryDto, ListarRaasResponseDto } from '../dtos/listar-raas.dto';

describe('RaaService - Listar RAAs Avanzado', () => {
  let service: RaaService;
  let mockRaaModel: any;

  // Mock data
  const mockRaas = [
    {
      id: 1,
      codigo: 'RAA-001',
      nombre: 'RAA de Algoritmos',
      descripcion: 'RAA sobre algoritmos y estructuras de datos',
      asignaturaId: 1,
      tipoRaaId: 1,
      nivel: 2,
      estadoActivo: true,
      creadoEn: new Date('2024-01-15'),
      actualizadoEn: new Date('2024-01-15'),
      toJSON: () => ({
        id: 1,
        codigo: 'RAA-001',
        nombre: 'RAA de Algoritmos',
        descripcion: 'RAA sobre algoritmos y estructuras de datos',
        asignaturaId: 1,
        tipoRaaId: 1,
        nivel: 2,
        estadoActivo: true,
        creadoEn: new Date('2024-01-15'),
        actualizadoEn: new Date('2024-01-15'),
      }),
    },
    {
      id: 2,
      codigo: 'RAA-002',
      nombre: 'RAA de Bases de Datos',
      descripcion: 'RAA sobre diseño y consultas de bases de datos',
      asignaturaId: 1,
      tipoRaaId: 2,
      nivel: 3,
      estadoActivo: true,
      creadoEn: new Date('2024-01-20'),
      actualizadoEn: new Date('2024-01-20'),
      toJSON: () => ({
        id: 2,
        codigo: 'RAA-002',
        nombre: 'RAA de Bases de Datos',
        descripcion: 'RAA sobre diseño y consultas de bases de datos',
        asignaturaId: 1,
        tipoRaaId: 2,
        nivel: 'AVANZADO',
        estadoActivo: true,
        creadoEn: new Date('2024-01-20'),
        actualizadoEn: new Date('2024-01-20'),
      }),
    },
  ];

  beforeEach(async () => {
    // Mock del modelo
    mockRaaModel = {
      findAndCountAll: jest.fn(),
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

  describe('listarRaasAvanzado', () => {
    describe('Funcionalidad básica', () => {
      it('debería listar RAAs con configuración por defecto', async () => {
        // Arrange
        const queryDto: ListarRaasQueryDto = {};
        const mockResult = { count: 2, rows: mockRaas };
        mockRaaModel.findAndCountAll.mockResolvedValue(mockResult);

        // Act
        const result = await service.listarRaasAvanzado(queryDto);

        // Assert
        expect(mockRaaModel.findAndCountAll).toHaveBeenCalledWith({
          where: {},
          limit: 10,
          offset: 0,
          order: [['creadoEn', 'DESC']],
          paranoid: true,
        });
        
        expect(result.exitoso).toBe(true);
        expect(result.datos).toHaveLength(2);
        expect(result.paginacion.paginaActual).toBe(1);
        expect(result.paginacion.limite).toBe(10);
        expect(result.paginacion.totalElementos).toBe(2);
        expect(result.paginacion.totalPaginas).toBe(1);
        expect(result.mensaje).toBe('Se encontraron 2 RAAs en el sistema');
      });

      it('debería aplicar paginación correctamente', async () => {
        // Arrange
        const queryDto: ListarRaasQueryDto = {
          pagina: 2,
          limite: 5,
        };
        const mockResult = { count: 12, rows: mockRaas };
        mockRaaModel.findAndCountAll.mockResolvedValue(mockResult);

        // Act
        const result = await service.listarRaasAvanzado(queryDto);

        // Assert
        expect(mockRaaModel.findAndCountAll).toHaveBeenCalledWith({
          where: {},
          limit: 5,
          offset: 5, // (página 2 - 1) * límite 5 = 5
          order: [['creadoEn', 'DESC']],
          paranoid: true,
        });
        
        expect(result.paginacion.paginaActual).toBe(2);
        expect(result.paginacion.limite).toBe(5);
        expect(result.paginacion.totalElementos).toBe(12);
        expect(result.paginacion.totalPaginas).toBe(3);
        expect(result.paginacion.tienePaginaAnterior).toBe(true);
        expect(result.paginacion.tienePaginaSiguiente).toBe(true);
      });

      it('debería aplicar ordenamiento personalizado', async () => {
        // Arrange
        const queryDto: ListarRaasQueryDto = {
          ordenarPor: 'nombre',
          direccion: 'ASC',
        };
        const mockResult = { count: 2, rows: mockRaas };
        mockRaaModel.findAndCountAll.mockResolvedValue(mockResult);

        // Act
        await service.listarRaasAvanzado(queryDto);

        // Assert
        expect(mockRaaModel.findAndCountAll).toHaveBeenCalledWith({
          where: {},
          limit: 10,
          offset: 0,
          order: [['nombre', 'ASC']],
          paranoid: true,
        });
      });
    });

    describe('Filtros', () => {
      it('debería filtrar por código', async () => {
        // Arrange
        const queryDto: ListarRaasQueryDto = {
          codigo: 'RAA-001',
        };
        const mockResult = { count: 1, rows: [mockRaas[0]] };
        mockRaaModel.findAndCountAll.mockResolvedValue(mockResult);

        // Act
        const result = await service.listarRaasAvanzado(queryDto);

        // Assert
        expect(mockRaaModel.findAndCountAll).toHaveBeenCalledWith({
          where: {
            codigo: { [Op.iLike]: '%RAA-001%' },
          },
          limit: 10,
          offset: 0,
          order: [['creadoEn', 'DESC']],
          paranoid: true,
        });
        
        expect(result.filtros.filtrosActivos).toContain('codigo');
        expect(result.filtros.valoresFiltros.codigo).toBe('RAA-001');
      });

      it('debería filtrar por asignatura', async () => {
        // Arrange
        const queryDto: ListarRaasQueryDto = {
          asignaturaId: 1,
        };
        const mockResult = { count: 2, rows: mockRaas };
        mockRaaModel.findAndCountAll.mockResolvedValue(mockResult);

        // Act
        await service.listarRaasAvanzado(queryDto);

        // Assert
        expect(mockRaaModel.findAndCountAll).toHaveBeenCalledWith({
          where: {
            asignaturaId: 1,
          },
          limit: 10,
          offset: 0,
          order: [['creadoEn', 'DESC']],
          paranoid: true,
        });
      });

      it('debería filtrar por tipo RAA', async () => {
        // Arrange
        const queryDto: ListarRaasQueryDto = {
          tipoRaaId: 1,
        };
        const mockResult = { count: 1, rows: [mockRaas[0]] };
        mockRaaModel.findAndCountAll.mockResolvedValue(mockResult);

        // Act
        await service.listarRaasAvanzado(queryDto);

        // Assert
        expect(mockRaaModel.findAndCountAll).toHaveBeenCalledWith({
          where: {
            tipoRaaId: 1,
          },
          limit: 10,
          offset: 0,
          order: [['creadoEn', 'DESC']],
          paranoid: true,
        });
      });

      it('debería filtrar por estado activo', async () => {
        // Arrange
        const queryDto: ListarRaasQueryDto = {
          estadoActivo: false,
        };
        const mockResult = { count: 0, rows: [] };
        mockRaaModel.findAndCountAll.mockResolvedValue(mockResult);

        // Act
        await service.listarRaasAvanzado(queryDto);

        // Assert
        expect(mockRaaModel.findAndCountAll).toHaveBeenCalledWith({
          where: {
            estadoActivo: false,
          },
          limit: 10,
          offset: 0,
          order: [['creadoEn', 'DESC']],
          paranoid: true,
        });
      });

      it('debería filtrar por nivel', async () => {
        // Arrange
        const queryDto: ListarRaasQueryDto = {
          nivel: 'INTERMEDIO',
        };
        const mockResult = { count: 1, rows: [mockRaas[0]] };
        mockRaaModel.findAndCountAll.mockResolvedValue(mockResult);

        // Act
        await service.listarRaasAvanzado(queryDto);

        // Assert
        expect(mockRaaModel.findAndCountAll).toHaveBeenCalledWith({
          where: {
            nivel: 'INTERMEDIO',
          },
          limit: 10,
          offset: 0,
          order: [['creadoEn', 'DESC']],
          paranoid: true,
        });
      });

      it('debería realizar búsqueda general', async () => {
        // Arrange
        const queryDto: ListarRaasQueryDto = {
          busqueda: 'algoritmos',
        };
        const mockResult = { count: 1, rows: [mockRaas[0]] };
        mockRaaModel.findAndCountAll.mockResolvedValue(mockResult);

        // Act
        const result = await service.listarRaasAvanzado(queryDto);

        // Assert
        expect(mockRaaModel.findAndCountAll).toHaveBeenCalledWith({
          where: {
            [Op.or]: [
              { nombre: { [Op.iLike]: '%algoritmos%' } },
              { descripcion: { [Op.iLike]: '%algoritmos%' } },
              { codigo: { [Op.iLike]: '%algoritmos%' } },
            ],
          },
          limit: 10,
          offset: 0,
          order: [['creadoEn', 'DESC']],
          paranoid: true,
        });
        
        expect(result.filtros.terminoBusqueda).toBe('algoritmos');
      });

      it('debería filtrar por rango de fechas', async () => {
        // Arrange
        const queryDto: ListarRaasQueryDto = {
          fechaCreacionDesde: '2024-01-10T00:00:00.000Z',
          fechaCreacionHasta: '2024-01-25T23:59:59.999Z',
        };
        const mockResult = { count: 2, rows: mockRaas };
        mockRaaModel.findAndCountAll.mockResolvedValue(mockResult);

        // Act
        await service.listarRaasAvanzado(queryDto);

        // Assert
        expect(mockRaaModel.findAndCountAll).toHaveBeenCalledWith({
          where: {
            creadoEn: {
              [Op.gte]: new Date('2024-01-10T00:00:00.000Z'),
              [Op.lte]: new Date('2024-01-25T23:59:59.999Z'),
            },
          },
          limit: 10,
          offset: 0,
          order: [['creadoEn', 'DESC']],
          paranoid: true,
        });
      });

      it('debería incluir eliminados cuando se especifica', async () => {
        // Arrange
        const queryDto: ListarRaasQueryDto = {
          incluirEliminados: true,
        };
        const mockResult = { count: 2, rows: mockRaas };
        mockRaaModel.findAndCountAll.mockResolvedValue(mockResult);

        // Act
        const result = await service.listarRaasAvanzado(queryDto);

        // Assert
        expect(mockRaaModel.findAndCountAll).toHaveBeenCalledWith({
          where: {},
          limit: 10,
          offset: 0,
          order: [['creadoEn', 'DESC']],
          paranoid: false, // Se cambió a false
        });
        
        expect(result.metadatos.incluyeEliminados).toBe(true);
        expect(result.metadatos.advertencias).toContain('La consulta incluye RAAs eliminados (soft delete)');
      });

      it('debería combinar múltiples filtros', async () => {
        // Arrange
        const queryDto: ListarRaasQueryDto = {
          codigo: 'RAA',
          asignaturaId: 1,
          estadoActivo: true,
          busqueda: 'algoritmos',
        };
        const mockResult = { count: 1, rows: [mockRaas[0]] };
        mockRaaModel.findAndCountAll.mockResolvedValue(mockResult);

        // Act
        const result = await service.listarRaasAvanzado(queryDto);

        // Assert
        expect(mockRaaModel.findAndCountAll).toHaveBeenCalledWith({
          where: {
            codigo: { [Op.iLike]: '%RAA%' },
            asignaturaId: 1,
            estadoActivo: true,
            [Op.or]: [
              { nombre: { [Op.iLike]: '%algoritmos%' } },
              { descripcion: { [Op.iLike]: '%algoritmos%' } },
              { codigo: { [Op.iLike]: '%algoritmos%' } },
            ],
          },
          limit: 10,
          offset: 0,
          order: [['creadoEn', 'DESC']],
          paranoid: true,
        });
        
        expect(result.filtros.filtrosActivos).toHaveLength(4);
      });
    });

    describe('Respuestas y mensajes', () => {
      it('debería generar mensaje correcto cuando no hay resultados', async () => {
        // Arrange
        const queryDto: ListarRaasQueryDto = {};
        const mockResult = { count: 0, rows: [] };
        mockRaaModel.findAndCountAll.mockResolvedValue(mockResult);

        // Act
        const result = await service.listarRaasAvanzado(queryDto);

        // Assert
        expect(result.mensaje).toBe('No hay RAAs registrados en el sistema');
        expect(result.datos).toHaveLength(0);
        expect(result.paginacion.totalElementos).toBe(0);
      });

      it('debería generar mensaje correcto con filtros aplicados sin resultados', async () => {
        // Arrange
        const queryDto: ListarRaasQueryDto = {
          codigo: 'NO-EXISTE',
        };
        const mockResult = { count: 0, rows: [] };
        mockRaaModel.findAndCountAll.mockResolvedValue(mockResult);

        // Act
        const result = await service.listarRaasAvanzado(queryDto);

        // Assert
        expect(result.mensaje).toBe('No se encontraron RAAs que cumplan con los criterios especificados');
      });

      it('debería generar mensaje correcto para un solo resultado', async () => {
        // Arrange
        const queryDto: ListarRaasQueryDto = {};
        const mockResult = { count: 1, rows: [mockRaas[0]] };
        mockRaaModel.findAndCountAll.mockResolvedValue(mockResult);

        // Act
        const result = await service.listarRaasAvanzado(queryDto);

        // Assert
        expect(result.mensaje).toBe('Se encontró 1 RAA en el sistema');
      });

      it('debería generar advertencias apropiadas', async () => {
        // Arrange
        const queryDto: ListarRaasQueryDto = {
          busqueda: 'ab', // Búsqueda muy corta
          fechaCreacionDesde: '2020-01-01T00:00:00.000Z',
          fechaCreacionHasta: '2024-12-31T23:59:59.999Z', // Rango muy amplio
        };
        const mockResult = { count: 2, rows: mockRaas };
        mockRaaModel.findAndCountAll.mockResolvedValue(mockResult);

        // Act
        const result = await service.listarRaasAvanzado(queryDto);

        // Assert
        expect(result.metadatos.advertencias).toContain('Términos de búsqueda muy cortos pueden devolver muchos resultados');
        expect(result.metadatos.advertencias).toContain('El rango de fechas especificado es muy amplio (>1 año)');
      });

      it('debería incluir tiempo de ejecución', async () => {
        // Arrange
        const queryDto: ListarRaasQueryDto = {};
        const mockResult = { count: 2, rows: mockRaas };
        mockRaaModel.findAndCountAll.mockResolvedValue(mockResult);

        // Act
        const result = await service.listarRaasAvanzado(queryDto);

        // Assert
        expect(result.tiempoEjecucion).toBeGreaterThanOrEqual(0);
        expect(typeof result.tiempoEjecucion).toBe('number');
      });

      it('debería incluir metadatos completos', async () => {
        // Arrange
        const queryDto: ListarRaasQueryDto = {};
        const mockResult = { count: 2, rows: mockRaas };
        mockRaaModel.findAndCountAll.mockResolvedValue(mockResult);

        // Act
        const result = await service.listarRaasAvanzado(queryDto);

        // Assert
        expect(result.metadatos).toHaveProperty('incluyeEliminados');
        expect(result.metadatos).toHaveProperty('consultaOptimizada');
        expect(result.metadatos).toHaveProperty('advertencias');
        expect(result.metadatos.consultaOptimizada).toBe(true);
      });
    });

    describe('Manejo de errores', () => {
      it('debería manejar errores de la base de datos', async () => {
        // Arrange
        const queryDto: ListarRaasQueryDto = {};
        const error = new Error('Error de conexión a la base de datos');
        mockRaaModel.findAndCountAll.mockRejectedValue(error);

        // Act & Assert
        await expect(service.listarRaasAvanzado(queryDto)).rejects.toThrow(BadRequestException);
        await expect(service.listarRaasAvanzado(queryDto)).rejects.toThrow('Error al listar RAAs: Error de conexión a la base de datos');
      });
    });
  });
});
