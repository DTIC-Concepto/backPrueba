import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateRaaRequestDto, UpdateRaaResponseDto } from '../dtos/update-raa.dto';

describe('UpdateRaaRequestDto', () => {
  it('debería validar correctamente un DTO válido completo', async () => {
    const dto = plainToClass(UpdateRaaRequestDto, {
      codigo: 'RAA-001',
      descripcion: 'Descripción del RAA',
      asignaturaId: 1,
      tipoRaaId: 2,
      estadoActivo: true,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('debería validar correctamente un DTO con campos opcionales', async () => {
    const dto = plainToClass(UpdateRaaRequestDto, {
      descripcion: 'Solo descripción',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('debería validar correctamente un DTO vacío (todos los campos opcionales)', async () => {
    const dto = plainToClass(UpdateRaaRequestDto, {});

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  describe('Validación del campo código', () => {
    it('debería aceptar un código válido', async () => {
      const dto = plainToClass(UpdateRaaRequestDto, {
        codigo: 'RAA-001',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('debería rechazar un código que no sea string', async () => {
      const dto = plainToClass(UpdateRaaRequestDto, {
        codigo: 123,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const codigoError = errors.find(error => error.property === 'codigo');
      expect(codigoError).toBeDefined();
      expect(codigoError?.constraints?.isString).toContain('cadena de texto');
    });
  });

  describe('Validación del campo descripción', () => {
    it('debería aceptar una descripción válida', async () => {
      const dto = plainToClass(UpdateRaaRequestDto, {
        descripcion: 'El estudiante será capaz de aplicar conocimientos...',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('debería rechazar una descripción que no sea string', async () => {
      const dto = plainToClass(UpdateRaaRequestDto, {
        descripcion: 123,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const descripcionError = errors.find(error => error.property === 'descripcion');
      expect(descripcionError).toBeDefined();
      expect(descripcionError?.constraints?.isString).toContain('cadena de texto');
    });
  });

  describe('Validación del campo asignaturaId', () => {
    it('debería aceptar un ID de asignatura válido', async () => {
      const dto = plainToClass(UpdateRaaRequestDto, {
        asignaturaId: '1', // String que se convierte a número
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.asignaturaId).toBe(1);
    });

    it('debería rechazar un ID de asignatura negativo', async () => {
      const dto = plainToClass(UpdateRaaRequestDto, {
        asignaturaId: '-1',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const asignaturaIdError = errors.find(error => error.property === 'asignaturaId');
      expect(asignaturaIdError).toBeDefined();
      expect(asignaturaIdError?.constraints?.min).toContain('mayor a 0');
    });

    it('debería rechazar un ID de asignatura cero', async () => {
      const dto = plainToClass(UpdateRaaRequestDto, {
        asignaturaId: '0',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const asignaturaIdError = errors.find(error => error.property === 'asignaturaId');
      expect(asignaturaIdError).toBeDefined();
      expect(asignaturaIdError?.constraints?.min).toContain('mayor a 0');
    });

    it('debería rechazar un ID de asignatura que no sea entero', async () => {
      const dto = plainToClass(UpdateRaaRequestDto, {
        asignaturaId: '1.5',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const asignaturaIdError = errors.find(error => error.property === 'asignaturaId');
      expect(asignaturaIdError).toBeDefined();
      expect(asignaturaIdError?.constraints?.isInt).toContain('número entero');
    });
  });

  describe('Validación del campo tipoRaaId', () => {
    it('debería aceptar un ID de tipo RAA válido', async () => {
      const dto = plainToClass(UpdateRaaRequestDto, {
        tipoRaaId: '2',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.tipoRaaId).toBe(2);
    });

    it('debería rechazar un ID de tipo RAA negativo', async () => {
      const dto = plainToClass(UpdateRaaRequestDto, {
        tipoRaaId: '-1',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const tipoRaaIdError = errors.find(error => error.property === 'tipoRaaId');
      expect(tipoRaaIdError).toBeDefined();
      expect(tipoRaaIdError?.constraints?.min).toContain('mayor a 0');
    });

    it('debería rechazar un ID de tipo RAA que no sea entero', async () => {
      const dto = plainToClass(UpdateRaaRequestDto, {
        tipoRaaId: '2.7',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const tipoRaaIdError = errors.find(error => error.property === 'tipoRaaId');
      expect(tipoRaaIdError).toBeDefined();
      expect(tipoRaaIdError?.constraints?.isInt).toContain('número entero');
    });
  });

  describe('Validación del campo estadoActivo', () => {
    it('debería aceptar true como estado activo', async () => {
      const dto = plainToClass(UpdateRaaRequestDto, {
        estadoActivo: true,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('debería aceptar false como estado activo', async () => {
      const dto = plainToClass(UpdateRaaRequestDto, {
        estadoActivo: false,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('debería rechazar un valor que no sea booleano', async () => {
      const dto = plainToClass(UpdateRaaRequestDto, {
        estadoActivo: 'true', // String en lugar de boolean
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const estadoActivoError = errors.find(error => error.property === 'estadoActivo');
      expect(estadoActivoError).toBeDefined();
      expect(estadoActivoError?.constraints?.isBoolean).toContain('valor booleano');
    });
  });

  describe('Validación combinada', () => {
    it('debería validar múltiples campos a la vez', async () => {
      const dto = plainToClass(UpdateRaaRequestDto, {
        codigo: 'RAA-UPDATE-001',
        descripcion: 'Descripción actualizada del RAA',
        asignaturaId: '5',
        estadoActivo: false,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.asignaturaId).toBe(5);
    });

    it('debería reportar múltiples errores si hay varios campos inválidos', async () => {
      const dto = plainToClass(UpdateRaaRequestDto, {
        codigo: 123, // Debería ser string
        asignaturaId: '-1', // Debería ser positivo
        tipoRaaId: '0', // Debería ser mayor a 0
        estadoActivo: 'no', // Debería ser boolean
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      const propertyErrors = errors.map(error => error.property);
      expect(propertyErrors).toContain('codigo');
      expect(propertyErrors).toContain('asignaturaId');
      expect(propertyErrors).toContain('tipoRaaId');
      expect(propertyErrors).toContain('estadoActivo');
    });
  });
});

describe('UpdateRaaResponseDto', () => {
  it('debería tener la estructura correcta para una respuesta exitosa', () => {
    const response: UpdateRaaResponseDto = {
      exitoso: true,
      mensaje: 'RAA actualizado correctamente',
      raa: {
        id: 1,
        codigo: 'RAA-001',
        descripcion: 'RAA actualizado',
      },
      camposModificados: ['descripcion', 'estadoActivo'],
      valoresAnteriores: {
        descripcion: 'Descripción anterior',
        estadoActivo: true,
      },
    };

    expect(response.exitoso).toBe(true);
    expect(response.mensaje).toBeDefined();
    expect(response.raa).toBeDefined();
    expect(response.camposModificados).toBeInstanceOf(Array);
    expect(response.valoresAnteriores).toBeDefined();
  });

  it('debería tener la estructura correcta para una respuesta sin cambios', () => {
    const response: UpdateRaaResponseDto = {
      exitoso: true,
      mensaje: 'No se detectaron cambios en los datos del RAA',
      raa: {
        id: 1,
        codigo: 'RAA-001',
        descripcion: 'RAA sin cambios',
      },
      camposModificados: [],
    };

    expect(response.exitoso).toBe(true);
    expect(response.camposModificados).toHaveLength(0);
    expect(response.valoresAnteriores).toBeUndefined();
  });
});
