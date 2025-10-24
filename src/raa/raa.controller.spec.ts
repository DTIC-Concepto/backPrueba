import { Test, TestingModule } from '@nestjs/testing';
import { RaaController } from './raa.controller';
import { RaaService } from './raa.service';
import { CreateRaaDto } from './dto/create-raa.dto';
import { UpdateRaaDto } from './dto/update-raa.dto';
import { FilterRaaDto } from './dto/filter-raa.dto';
import { RaaModel } from './models/raa.model';
import { TipoRaaEnum } from '../common/enums/tipo-raa.enum';

describe('RaaController', () => {
  let controller: RaaController;
  let service: RaaService;

  const mockRaa: RaaModel = {
    id: 1,
    codigo: '1.1',
    tipo: TipoRaaEnum.CONOCIMIENTOS,
    descripcion: 'RAA de prueba',
    carreraAsignaturaId: 2,
    estadoActivo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    carreraAsignatura: undefined,
    update: jest.fn(),
    destroy: jest.fn(),
  } as any;

  const serviceMock = {
    create: jest.fn().mockResolvedValue(mockRaa),
    findAll: jest.fn().mockResolvedValue([mockRaa]),
    findOne: jest.fn().mockResolvedValue(mockRaa),
    update: jest.fn().mockResolvedValue(mockRaa),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RaaController],
      providers: [
        { provide: RaaService, useValue: serviceMock },
      ],
    }).compile();

    controller = module.get<RaaController>(RaaController);
    service = module.get<RaaService>(RaaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a RAA', async () => {
    const dto: CreateRaaDto = {
      codigo: '1.1',
      tipo: TipoRaaEnum.CONOCIMIENTOS,
      descripcion: 'RAA de prueba',
      asignaturaId: 1,
    };
    const result = await controller.create(dto);
    expect(result).toEqual(mockRaa);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should get all RAAs', async () => {
    const filter: FilterRaaDto = {};
    const result = await controller.findAll(filter);
    expect(result).toEqual([mockRaa]);
    expect(service.findAll).toHaveBeenCalledWith(filter);
  });

  it('should get one RAA', async () => {
    const result = await controller.findOne(1);
    expect(result).toEqual(mockRaa);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('should update a RAA', async () => {
    const dto: UpdateRaaDto = { descripcion: 'Modificado' };
    const result = await controller.update(1, dto);
    expect(result).toEqual(mockRaa);
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('should remove a RAA', async () => {
    const result = await controller.remove(1);
    expect(result).toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
