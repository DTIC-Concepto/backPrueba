import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Op } from 'sequelize';
import { ResultadosAprendizajeService } from './resultados-aprendizaje.service';
import { ResultadoAprendizajeModel } from './models/resultado-aprendizaje.model';
import { CarreraModel } from '../carreras/models/carrera.model';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateResultadoAprendizajeDto } from './dto/create-resultado-aprendizaje.dto';
import { FilterResultadoAprendizajeDto } from './dto/filter-resultado-aprendizaje.dto';
import { TipoRA } from './models/resultado-aprendizaje.model';

describe('ResultadosAprendizajeService', () => {
  let service: ResultadosAprendizajeService;
  let resultadoAprendizajeModel: typeof ResultadoAprendizajeModel;
  let carreraModel: typeof CarreraModel;
  let auditoriaService: AuditoriaService;

  const mockResultadoAprendizajeModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
  };

  const mockCarreraModel = {
    findByPk: jest.fn(),
  };

  const mockAuditoriaService = {
    registrarEvento: jest.fn(),
  };

  const mockCarrera = {
    id: 1,
    codigo: 'ISC',
    nombre: 'Ingeniería en Sistemas Computacionales',
    facultadId: 1,
  };

  const mockRA = {
    id: 1,
    codigo: 'RA1',
    descripcion: 'Test resultado de aprendizaje',
    tipo: TipoRA.GENERAL,
    carreraId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultadosAprendizajeService,
        {
          provide: getModelToken(ResultadoAprendizajeModel),
          useValue: mockResultadoAprendizajeModel,
        },
        {
          provide: getModelToken(CarreraModel),
          useValue: mockCarreraModel,
        },
        {
          provide: AuditoriaService,
          useValue: mockAuditoriaService,
        },
      ],
    }).compile();

    service = module.get<ResultadosAprendizajeService>(ResultadosAprendizajeService);
    resultadoAprendizajeModel = module.get<typeof ResultadoAprendizajeModel>(
      getModelToken(ResultadoAprendizajeModel),
    );
    carreraModel = module.get<typeof CarreraModel>(getModelToken(CarreraModel));
    auditoriaService = module.get<AuditoriaService>(AuditoriaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateResultadoAprendizajeDto = {
      codigo: 'RA1',
      descripcion: 'Test resultado de aprendizaje',
      tipo: TipoRA.GENERAL,
      carreraId: 1,
    };

    it('should create a new RA successfully with provided code', async () => {
      mockCarreraModel.findByPk.mockResolvedValue(mockCarrera);
      mockResultadoAprendizajeModel.findOne.mockResolvedValue(null);
      mockResultadoAprendizajeModel.create.mockResolvedValue(mockRA);
      mockAuditoriaService.registrarEvento.mockResolvedValue(undefined);

      const result = await service.create(createDto, 1);

      expect(mockCarreraModel.findByPk).toHaveBeenCalledWith(1);
      expect(mockResultadoAprendizajeModel.findOne).toHaveBeenCalledWith({
        where: {
          codigo: 'RA1',
          tipo: TipoRA.GENERAL,
          carreraId: 1,
        },
      });
      expect(mockResultadoAprendizajeModel.create).toHaveBeenCalledWith({
        codigo: 'RA1',
        descripcion: 'Test resultado de aprendizaje',
        tipo: TipoRA.GENERAL,
        carreraId: 1,
      });
      expect(mockAuditoriaService.registrarEvento).toHaveBeenCalled();
      expect(result).toEqual(mockRA);
    });

    it('should auto-generate code when not provided', async () => {
      const createDtoWithoutCode = { ...createDto };
      delete createDtoWithoutCode.codigo;

      mockCarreraModel.findByPk.mockResolvedValue(mockCarrera);
      mockResultadoAprendizajeModel.findAll.mockResolvedValue([]);
      mockResultadoAprendizajeModel.create.mockResolvedValue({
        ...mockRA,
        codigo: 'RA1',
      });
      mockAuditoriaService.registrarEvento.mockResolvedValue(undefined);

      const result = await service.create(createDtoWithoutCode, 1);

      expect(mockResultadoAprendizajeModel.findAll).toHaveBeenCalledWith({
        where: {
          tipo: TipoRA.GENERAL,
          carreraId: 1,
          codigo: { [Op.like]: 'RA%' },
        },
        attributes: ['codigo'],
        order: [['codigo', 'ASC']],
      });
      expect(mockResultadoAprendizajeModel.create).toHaveBeenCalledWith({
        codigo: 'RA1',
        descripcion: 'Test resultado de aprendizaje',
        tipo: TipoRA.GENERAL,
        carreraId: 1,
      });
      expect(result.codigo).toBe('RA1');
    });

    it('should auto-generate RAE prefix for ESPECIFICO type', async () => {
      const createDtoEspecifico = {
        ...createDto,
        tipo: TipoRA.ESPECIFICO,
      };
      delete createDtoEspecifico.codigo;

      mockCarreraModel.findByPk.mockResolvedValue(mockCarrera);
      mockResultadoAprendizajeModel.findAll.mockResolvedValue([]);
      mockResultadoAprendizajeModel.create.mockResolvedValue({
        ...mockRA,
        codigo: 'RAE1',
        tipo: TipoRA.ESPECIFICO,
      });
      mockAuditoriaService.registrarEvento.mockResolvedValue(undefined);

      await service.create(createDtoEspecifico, 1);

      expect(mockResultadoAprendizajeModel.findAll).toHaveBeenCalledWith({
        where: {
          tipo: TipoRA.ESPECIFICO,
          carreraId: 1,
          codigo: { [Op.like]: 'RAE%' },
        },
        attributes: ['codigo'],
        order: [['codigo', 'ASC']],
      });
      expect(mockResultadoAprendizajeModel.create).toHaveBeenCalledWith({
        codigo: 'RAE1',
        descripcion: 'Test resultado de aprendizaje',
        tipo: TipoRA.ESPECIFICO,
        carreraId: 1,
      });
    });

    it('should generate next available code when gaps exist', async () => {
      const createDtoWithoutCode = { ...createDto };
      delete createDtoWithoutCode.codigo;

      const existingRAs = [
        { codigo: 'RA1' },
        { codigo: 'RA2' },
        { codigo: 'RA4' }, // Gap at RA3
      ];

      mockCarreraModel.findByPk.mockResolvedValue(mockCarrera);
      mockResultadoAprendizajeModel.findAll.mockResolvedValue(existingRAs);
      mockResultadoAprendizajeModel.create.mockResolvedValue({
        ...mockRA,
        codigo: 'RA3',
      });
      mockAuditoriaService.registrarEvento.mockResolvedValue(undefined);

      await service.create(createDtoWithoutCode, 1);

      expect(mockResultadoAprendizajeModel.create).toHaveBeenCalledWith({
        codigo: 'RA3',
        descripcion: 'Test resultado de aprendizaje',
        tipo: TipoRA.GENERAL,
        carreraId: 1,
      });
    });

    it('should throw NotFoundException when carrera does not exist', async () => {
      mockCarreraModel.findByPk.mockResolvedValue(null);

      await expect(service.create(createDto, 1)).rejects.toThrow(NotFoundException);
      expect(mockCarreraModel.findByPk).toHaveBeenCalledWith(1);
    });

    it('should throw ConflictException when code already exists', async () => {
      mockCarreraModel.findByPk.mockResolvedValue(mockCarrera);
      mockResultadoAprendizajeModel.findOne.mockResolvedValue(mockRA);

      await expect(service.create(createDto, 1)).rejects.toThrow(ConflictException);
      expect(mockResultadoAprendizajeModel.findOne).toHaveBeenCalledWith({
        where: {
          codigo: 'RA1',
          tipo: TipoRA.GENERAL,
          carreraId: 1,
        },
      });
    });

    it('should handle create without userId (no audit)', async () => {
      mockCarreraModel.findByPk.mockResolvedValue(mockCarrera);
      mockResultadoAprendizajeModel.findOne.mockResolvedValue(null);
      mockResultadoAprendizajeModel.create.mockResolvedValue(mockRA);

      const result = await service.create(createDto);

      expect(mockAuditoriaService.registrarEvento).not.toHaveBeenCalled();
      expect(result).toEqual(mockRA);
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      mockCarreraModel.findByPk.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createDto, 1)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAllWithFiltersAndPagination', () => {
    const mockPaginatedResult = {
      rows: [mockRA],
      count: 1,
    };

    it('should return paginated results with no filters', async () => {
      const filterDto: FilterResultadoAprendizajeDto = {
        page: 1,
        limit: 10,
      };

      mockResultadoAprendizajeModel.findAndCountAll.mockResolvedValue(mockPaginatedResult);

      const result = await service.findAllWithFiltersAndPagination(filterDto);

      expect(mockResultadoAprendizajeModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        include: [{
          model: CarreraModel,
          as: 'carrera',
          attributes: ['id', 'codigo', 'nombre'],
        }],
        order: [['codigo', 'ASC']],
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual({
        data: [mockRA],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      });
    });

    it('should apply codigo filter', async () => {
      const filterDto: FilterResultadoAprendizajeDto = {
        codigo: 'RA1',
        page: 1,
        limit: 10,
      };

      mockResultadoAprendizajeModel.findAndCountAll.mockResolvedValue(mockPaginatedResult);

      await service.findAllWithFiltersAndPagination(filterDto);

      expect(mockResultadoAprendizajeModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          codigo: { [Op.iLike]: '%RA1%' },
        },
        include: [{
          model: CarreraModel,
          as: 'carrera',
          attributes: ['id', 'codigo', 'nombre'],
        }],
        order: [['codigo', 'ASC']],
        limit: 10,
        offset: 0,
      });
    });

    it('should apply descripcion filter', async () => {
      const filterDto: FilterResultadoAprendizajeDto = {
        descripcion: 'test',
        page: 1,
        limit: 10,
      };

      mockResultadoAprendizajeModel.findAndCountAll.mockResolvedValue(mockPaginatedResult);

      await service.findAllWithFiltersAndPagination(filterDto);

      expect(mockResultadoAprendizajeModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          descripcion: { [Op.iLike]: '%test%' },
        },
        include: [{
          model: CarreraModel,
          as: 'carrera',
          attributes: ['id', 'codigo', 'nombre'],
        }],
        order: [['codigo', 'ASC']],
        limit: 10,
        offset: 0,
      });
    });

    it('should apply tipo filter', async () => {
      const filterDto: FilterResultadoAprendizajeDto = {
        tipo: TipoRA.GENERAL,
        page: 1,
        limit: 10,
      };

      mockResultadoAprendizajeModel.findAndCountAll.mockResolvedValue(mockPaginatedResult);

      await service.findAllWithFiltersAndPagination(filterDto);

      expect(mockResultadoAprendizajeModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          tipo: TipoRA.GENERAL,
        },
        include: [{
          model: CarreraModel,
          as: 'carrera',
          attributes: ['id', 'codigo', 'nombre'],
        }],
        order: [['codigo', 'ASC']],
        limit: 10,
        offset: 0,
      });
    });

    it('should apply carreraId filter', async () => {
      const filterDto: FilterResultadoAprendizajeDto = {
        carreraId: 1,
        page: 1,
        limit: 10,
      };

      mockResultadoAprendizajeModel.findAndCountAll.mockResolvedValue(mockPaginatedResult);

      await service.findAllWithFiltersAndPagination(filterDto);

      expect(mockResultadoAprendizajeModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          carreraId: 1,
        },
        include: [{
          model: CarreraModel,
          as: 'carrera',
          attributes: ['id', 'codigo', 'nombre'],
        }],
        order: [['codigo', 'ASC']],
        limit: 10,
        offset: 0,
      });
    });

    it('should apply search filter (OR condition)', async () => {
      const filterDto: FilterResultadoAprendizajeDto = {
        search: 'desarrollo',
        page: 1,
        limit: 10,
      };

      mockResultadoAprendizajeModel.findAndCountAll.mockResolvedValue(mockPaginatedResult);

      await service.findAllWithFiltersAndPagination(filterDto);

      expect(mockResultadoAprendizajeModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { codigo: { [Op.iLike]: '%desarrollo%' } },
            { descripcion: { [Op.iLike]: '%desarrollo%' } },
          ],
        },
        include: [{
          model: CarreraModel,
          as: 'carrera',
          attributes: ['id', 'codigo', 'nombre'],
        }],
        order: [['codigo', 'ASC']],
        limit: 10,
        offset: 0,
      });
    });

    it('should apply multiple filters combined', async () => {
      const filterDto: FilterResultadoAprendizajeDto = {
        codigo: 'RA',
        tipo: TipoRA.GENERAL,
        carreraId: 1,
        page: 2,
        limit: 5,
      };

      mockResultadoAprendizajeModel.findAndCountAll.mockResolvedValue({
        rows: [mockRA],
        count: 15,
      });

      const result = await service.findAllWithFiltersAndPagination(filterDto);

      expect(mockResultadoAprendizajeModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          codigo: { [Op.iLike]: '%RA%' },
          tipo: TipoRA.GENERAL,
          carreraId: 1,
        },
        include: [{
          model: CarreraModel,
          as: 'carrera',
          attributes: ['id', 'codigo', 'nombre'],
        }],
        order: [['codigo', 'ASC']],
        limit: 5,
        offset: 5, // page 2 with limit 5
      });

      expect(result).toEqual({
        data: [mockRA],
        total: 15,
        page: 2,
        limit: 5,
        totalPages: 3, // Math.ceil(15/5)
        hasPrevious: true,
        hasNext: true,
      });
    });

    it('should calculate pagination metadata correctly for last page', async () => {
      const filterDto: FilterResultadoAprendizajeDto = {
        page: 3,
        limit: 5,
      };

      mockResultadoAprendizajeModel.findAndCountAll.mockResolvedValue({
        rows: [mockRA],
        count: 11, // 11 total items, 3 pages of 5
      });

      const result = await service.findAllWithFiltersAndPagination(filterDto);

      expect(result).toEqual({
        data: [mockRA],
        total: 11,
        page: 3,
        limit: 5,
        totalPages: 3, // Math.ceil(11/5)
        hasPrevious: true,
        hasNext: false, // Last page
      });
    });

    it('should handle empty results', async () => {
      const filterDto: FilterResultadoAprendizajeDto = {
        page: 1,
        limit: 10,
      };

      mockResultadoAprendizajeModel.findAndCountAll.mockResolvedValue({
        rows: [],
        count: 0,
      });

      const result = await service.findAllWithFiltersAndPagination(filterDto);

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      });
    });

    it('should throw InternalServerErrorException on database error', async () => {
      const filterDto: FilterResultadoAprendizajeDto = {
        page: 1,
        limit: 10,
      };

      mockResultadoAprendizajeModel.findAndCountAll.mockRejectedValue(new Error('DB Error'));

      await expect(service.findAllWithFiltersAndPagination(filterDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findById', () => {
    it('should return RA by id with carrera relation', async () => {
      const raWithCarrera = { ...mockRA, carrera: mockCarrera };
      mockResultadoAprendizajeModel.findOne.mockResolvedValue(raWithCarrera);

      const result = await service.findById(1);

      expect(mockResultadoAprendizajeModel.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        include: [{
          model: CarreraModel,
          as: 'carrera',
          attributes: ['id', 'codigo', 'nombre'],
        }],
      });
      expect(result).toEqual(raWithCarrera);
    });

    it('should return null when RA not found', async () => {
      mockResultadoAprendizajeModel.findOne.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByCarrera', () => {
    it('should return RAs by carrera ordered by tipo and codigo', async () => {
      const ras = [mockRA];
      mockResultadoAprendizajeModel.findAll.mockResolvedValue(ras);

      const result = await service.findByCarrera(1);

      expect(mockResultadoAprendizajeModel.findAll).toHaveBeenCalledWith({
        where: { carreraId: 1 },
        include: [{
          model: CarreraModel,
          as: 'carrera',
          attributes: ['id', 'codigo', 'nombre'],
        }],
        order: [['tipo', 'ASC'], ['codigo', 'ASC']],
      });
      expect(result).toEqual(ras);
    });
  });
});