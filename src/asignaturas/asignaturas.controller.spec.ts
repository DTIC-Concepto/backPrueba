import { Test, TestingModule } from '@nestjs/testing';
import { AsignaturasController } from './asignaturas.controller';
import { AsignaturasService } from './asignaturas.service';

import { CreateAsignaturaDto } from './dto/create-asignatura.dto';
import { UpdateAsignaturaDto } from './dto/update-asignatura.dto';
import { FilterAsignaturaDto } from './dto/filter-asignatura.dto';
import { AsignaturaModel } from './models/asignatura.model';
import { TipoAsignaturaEnum } from '../common/enums/tipo-asignatura.enum';
import { UnidadCurricularEnum } from '../common/enums/unidad-curricular.enum';

describe('AsignaturasController', () => {
  let controller: AsignaturasController;
  let service: AsignaturasService;

  const mockAsignatura: AsignaturaModel = {
    id: 1,
    codigo: 'ASG001',
    nombre: 'Asignatura Test',
    creditos: 3,
    descripcion: 'Desc',
  tipoAsignatura: TipoAsignaturaEnum.OBLIGATORIA,
  unidadCurricular: UnidadCurricularEnum.UNIDAD_PROFESIONAL,
    pensum: 2023,
    nivelReferencial: 1,
    estadoActivo: true,
    carreras: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const serviceMock = {
    create: jest.fn().mockResolvedValue(mockAsignatura),
    findAll: jest.fn().mockResolvedValue([mockAsignatura]),
    findOne: jest.fn().mockResolvedValue(mockAsignatura),
    getCarreraAsignaturaId: jest.fn().mockResolvedValue({ id: 1, carreraId: 1, asignaturaId: 1 }),
    update: jest.fn().mockResolvedValue(mockAsignatura),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AsignaturasController],
      providers: [
        { provide: AsignaturasService, useValue: serviceMock },
      ],
    }).compile();

    controller = module.get<AsignaturasController>(AsignaturasController);
    service = module.get<AsignaturasService>(AsignaturasService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an asignatura', async () => {
    const dto: CreateAsignaturaDto = {
      codigo: 'ASG001',
      nombre: 'Asignatura Test',
      creditos: 3,
      descripcion: 'Desc',
      tipoAsignatura: TipoAsignaturaEnum.OBLIGATORIA,
      unidadCurricular: UnidadCurricularEnum.UNIDAD_PROFESIONAL,
      pensum: 2023,
      nivelReferencial: 1,
      carreraIds: [1],
    };
    const result = await controller.create(dto);
    expect(result).toEqual(mockAsignatura);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should get all asignaturas', async () => {
    const filter: FilterAsignaturaDto = {};
    const result = await controller.findAll(filter);
    expect(result).toEqual([mockAsignatura]);
    expect(service.findAll).toHaveBeenCalledWith(filter);
  });

  it('should get one asignatura', async () => {
    const result = await controller.findOne(1);
    expect(result).toEqual(mockAsignatura);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('should get carrera-asignatura relation id', async () => {
    const result = await controller.getCarreraAsignaturaId(1, 1);
    expect(result).toEqual({ id: 1, carreraId: 1, asignaturaId: 1 });
    expect(service.getCarreraAsignaturaId).toHaveBeenCalledWith(1, 1);
  });

  it('should update an asignatura', async () => {
    const dto: UpdateAsignaturaDto = { nombre: 'Modificada' };
    const result = await controller.update(1, dto);
    expect(result).toEqual(mockAsignatura);
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('should remove an asignatura', async () => {
    const result = await controller.remove(1);
    expect(result).toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
