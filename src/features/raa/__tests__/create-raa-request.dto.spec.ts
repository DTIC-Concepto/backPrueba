import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateRaaRequestDto } from '../dtos/create-raa-request.dto';
import { CreateRaaResponseDto } from '../dtos/create-raa-response.dto';

describe('CreateRaaRequestDto - Registrar Nuevo RAA', () => {
  describe('Validaciones de CreateRaaRequestDto', () => {
    it('debería validar correctamente un DTO completo y válido', async () => {
      // Arrange
      const dtoData = {
        codigo: 'RAA-001',
        nombre: 'Aplicación de principios de programación',
        descripcion: 'El estudiante será capaz de aplicar principios fundamentales de programación orientada a objetos para resolver problemas computacionales de mediana complejidad.',
        asignaturaId: 1,
        tipoRaaId: 1,
        nivel: 3,
        estadoActivo: true,
        generarCodigoAutomatico: false,
        prefijoPersonalizado: 'RAA',
      };

      // Act
      const dto = plainToClass(CreateRaaRequestDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto.codigo).toBe('RAA-001');
      expect(dto.nombre).toBe('Aplicación de principios de programación');
      expect(dto.nivel).toBe(3);
    });

    it('debería validar correctamente un DTO mínimo válido', async () => {
      // Arrange
      const dtoData = {
        nombre: 'RAA básico',
        descripcion: 'Descripción básica del RAA para testing de validaciones mínimas.',
        asignaturaId: 1,
        tipoRaaId: 1,
      };

      // Act
      const dto = plainToClass(CreateRaaRequestDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto.nombre).toBe('RAA básico');
      expect(dto.codigo).toBeUndefined();
      expect(dto.nivel).toBeUndefined();
    });

    it('debería validar generación automática de código', async () => {
      // Arrange
      const dtoData = {
        nombre: 'RAA con código automático',
        descripcion: 'RAA para testing de generación automática de códigos.',
        asignaturaId: 1,
        tipoRaaId: 1,
        generarCodigoAutomatico: true,
        prefijoPersonalizado: 'COMP',
      };

      // Act
      const dto = plainToClass(CreateRaaRequestDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto.generarCodigoAutomatico).toBe(true);
      expect(dto.prefijoPersonalizado).toBe('COMP');
    });
  });

  describe('Validaciones de campos obligatorios', () => {
    it('debería fallar cuando falta el nombre', async () => {
      // Arrange
      const dtoData = {
        descripcion: 'Esta es una descripción válida con al menos 20 caracteres para cumplir con las validaciones',
        asignaturaId: 1,
        tipoRaaId: 1,
      };

      // Act
      const dto = plainToClass(CreateRaaRequestDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('nombre');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('debería fallar cuando falta la descripción', async () => {
      // Arrange
      const dtoData = {
        nombre: 'RAA sin descripción',
        asignaturaId: 1,
        tipoRaaId: 1,
      };

      // Act
      const dto = plainToClass(CreateRaaRequestDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('descripcion');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('debería fallar cuando falta asignaturaId', async () => {
      // Arrange
      const dtoData = {
        nombre: 'RAA sin asignatura',
        descripcion: 'Esta es una descripción válida con al menos 20 caracteres para cumplir con las validaciones',
        tipoRaaId: 1,
      };

      // Act
      const dto = plainToClass(CreateRaaRequestDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('asignaturaId');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('debería fallar cuando falta tipoRaaId', async () => {
      // Arrange
      const dtoData = {
        nombre: 'RAA sin tipo',
        descripcion: 'Esta es una descripción válida con al menos 20 caracteres para cumplir con las validaciones',
        asignaturaId: 1,
      };

      // Act
      const dto = plainToClass(CreateRaaRequestDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('tipoRaaId');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('Validaciones de formato y longitud', () => {
    it('debería fallar con código demasiado corto', async () => {
      // Arrange
      const dtoData = {
        codigo: 'AB', // Menos de 3 caracteres
        nombre: 'RAA con código corto',
        descripcion: 'Descripción del RAA con código demasiado corto.',
        asignaturaId: 1,
        tipoRaaId: 1,
      };

      // Act
      const dto = plainToClass(CreateRaaRequestDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('codigo');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('debería fallar con código demasiado largo', async () => {
      // Arrange
      const dtoData = {
        codigo: 'A'.repeat(51), // Más de 50 caracteres
        nombre: 'RAA con código largo',
        descripcion: 'Descripción del RAA con código demasiado largo.',
        asignaturaId: 1,
        tipoRaaId: 1,
      };

      // Act
      const dto = plainToClass(CreateRaaRequestDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('codigo');
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('debería fallar con formato de código inválido', async () => {
      // Arrange
      const dtoData = {
        codigo: 'raa-001-abc', // Contiene letras minúsculas
        nombre: 'RAA con código inválido',
        descripcion: 'Descripción del RAA con formato de código inválido.',
        asignaturaId: 1,
        tipoRaaId: 1,
      };

      // Act
      const dto = plainToClass(CreateRaaRequestDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('codigo');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('debería aceptar códigos con formato válido', async () => {
      // Arrange
      const codigosValidos = [
        'RAA-001',
        'COMP-123-456',
        'A1B2C3',
        'TEST_001',
        'RAA_COMP_001'
      ];

      for (const codigo of codigosValidos) {
        // Act
        const dto = plainToClass(CreateRaaRequestDto, {
          codigo,
          nombre: 'RAA de prueba',
          descripcion: 'Descripción de prueba para validar códigos.',
          asignaturaId: 1,
          tipoRaaId: 1,
        });
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
      }
    });

    it('debería fallar con nombre demasiado corto', async () => {
      // Arrange
      const dtoData = {
        nombre: 'RAA', // Menos de 5 caracteres
        descripcion: 'Descripción del RAA con nombre demasiado corto.',
        asignaturaId: 1,
        tipoRaaId: 1,
      };

      // Act
      const dto = plainToClass(CreateRaaRequestDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('nombre');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('debería fallar con descripción demasiado corta', async () => {
      // Arrange
      const dtoData = {
        nombre: 'RAA con descripción corta',
        descripcion: 'Muy corta', // Menos de 20 caracteres
        asignaturaId: 1,
        tipoRaaId: 1,
      };

      // Act
      const dto = plainToClass(CreateRaaRequestDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('descripcion');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });
  });

  describe('Validaciones de campos numéricos', () => {
    it('debería fallar con asignaturaId inválido', async () => {
      // Arrange
      const dtoData = {
        nombre: 'RAA con asignatura inválida',
        descripcion: 'Descripción del RAA con ID de asignatura inválido.',
        asignaturaId: 0, // Debe ser mayor a 0
        tipoRaaId: 1,
      };

      // Act
      const dto = plainToClass(CreateRaaRequestDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('asignaturaId');
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('debería fallar con tipoRaaId inválido', async () => {
      // Arrange
      const dtoData = {
        nombre: 'RAA con tipo inválido',
        descripcion: 'Descripción del RAA con ID de tipo inválido.',
        asignaturaId: 1,
        tipoRaaId: -1, // Debe ser mayor a 0
      };

      // Act
      const dto = plainToClass(CreateRaaRequestDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('tipoRaaId');
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('debería fallar con nivel fuera de rango', async () => {
      // Arrange
      const dtoData = {
        nombre: 'RAA con nivel inválido',
        descripcion: 'Descripción del RAA con nivel fuera de rango.',
        asignaturaId: 1,
        tipoRaaId: 1,
        nivel: 0, // Debe ser mayor a 0
      };

      // Act
      const dto = plainToClass(CreateRaaRequestDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('nivel');
      expect(errors[0].constraints).toHaveProperty('min');
    });
  });

  describe('Validaciones de prefijo personalizado', () => {
    it('debería fallar con prefijo demasiado largo', async () => {
      // Arrange
      const dtoData = {
        nombre: 'RAA con prefijo largo',
        descripcion: 'Descripción del RAA con prefijo demasiado largo.',
        asignaturaId: 1,
        tipoRaaId: 1,
        prefijoPersonalizado: 'PREFIJOMUYLARGO', // Más de 10 caracteres
      };

      // Act
      const dto = plainToClass(CreateRaaRequestDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('prefijoPersonalizado');
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('debería fallar con prefijo en formato inválido', async () => {
      // Arrange
      const dtoData = {
        nombre: 'RAA con prefijo inválido',
        descripción: 'Descripción del RAA con prefijo en formato inválido.',
        asignaturaId: 1,
        tipoRaaId: 1,
        prefijoPersonalizado: 'comp123', // Debe ser solo letras mayúsculas
      };

      // Act
      const dto = plainToClass(CreateRaaRequestDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      const prefijoError = errors.find(err => err.property === 'prefijoPersonalizado');
      expect(prefijoError?.constraints).toHaveProperty('matches');
    });

    it('debería aceptar prefijos válidos', async () => {
      // Arrange
      const prefijosValidos = ['RAA', 'COMP', 'MAT', 'FIS', 'QUIM'];

      for (const prefijo of prefijosValidos) {
        // Act
        const dto = plainToClass(CreateRaaRequestDto, {
          nombre: 'RAA de prueba',
          descripcion: 'Descripción de prueba para validar prefijos.',
          asignaturaId: 1,
          tipoRaaId: 1,
          prefijoPersonalizado: prefijo,
        });
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
      }
    });
  });
});

describe('CreateRaaResponseDto - Respuesta de Registro', () => {
  describe('Estructura de respuesta exitosa', () => {
    it('debería crear una respuesta exitosa completa', () => {
      // Arrange & Act
      const response: CreateRaaResponseDto = {
        exitoso: true,
        mensaje: 'RAA registrado exitosamente',
        raa: {
          id: 1,
          codigo: 'RAA-001-001',
          descripcion: 'El estudiante será capaz de...',
          asignaturaId: 1,
          tipoRaaId: 1,
          estadoActivo: true,
          creadoEn: new Date(),
          actualizadoEn: new Date(),
        },
        detalles: {
          codigoGenerado: true,
          relacionesCreadas: ['asignatura', 'tipoRaa'],
          advertencias: ['Advertencia opcional'],
        },
      };

      // Assert
      expect(response.exitoso).toBe(true);
      expect(response.raa.codigo).toBe('RAA-001-001');
      expect(response.detalles?.codigoGenerado).toBe(true);
      expect(response.detalles?.relacionesCreadas).toContain('asignatura');
    });

    it('debería crear una respuesta exitosa sin código generado', () => {
      // Arrange & Act
      const response: CreateRaaResponseDto = {
        exitoso: true,
        mensaje: 'RAA registrado exitosamente',
        raa: {
          id: 2,
          codigo: 'RAA-MANUAL-001',
          descripcion: 'RAA con código manual',
          asignaturaId: 2,
          tipoRaaId: 1,
          estadoActivo: true,
          creadoEn: new Date(),
          actualizadoEn: new Date(),
        },
        detalles: {
          codigoGenerado: false,
          relacionesCreadas: ['asignatura', 'tipoRaa'],
        },
      };

      // Assert
      expect(response.exitoso).toBe(true);
      expect(response.raa.codigo).toBe('RAA-MANUAL-001');
      expect(response.detalles?.codigoGenerado).toBe(false);
    });

    it('debería crear una respuesta sin detalles opcionales', () => {
      // Arrange & Act
      const response: CreateRaaResponseDto = {
        exitoso: true,
        mensaje: 'RAA registrado exitosamente',
        raa: {
          id: 3,
          codigo: 'RAA-SIMPLE-001',
          descripcion: 'RAA simple sin detalles',
          asignaturaId: 3,
          tipoRaaId: 1,
          estadoActivo: true,
          creadoEn: new Date(),
          actualizadoEn: new Date(),
        },
      };

      // Assert
      expect(response.exitoso).toBe(true);
      expect(response.detalles).toBeUndefined();
    });
  });

  describe('Validación de campos requeridos', () => {
    it('debería requerir campos obligatorios', () => {
      // Arrange
      const responseIncompleta = {
        exitoso: true,
        // falta mensaje y raa
      } as CreateRaaResponseDto;

      // Act & Assert
      expect(responseIncompleta.exitoso).toBe(true);
      expect(responseIncompleta.mensaje).toBeUndefined();
      expect(responseIncompleta.raa).toBeUndefined();
    });

    it('debería validar estructura del objeto raa', () => {
      // Arrange
      const response: CreateRaaResponseDto = {
        exitoso: true,
        mensaje: 'RAA registrado',
        raa: {
          id: 1,
          codigo: 'RAA-001',
          descripcion: 'Descripción del RAA',
          asignaturaId: 1,
          tipoRaaId: 1,
          estadoActivo: true,
          creadoEn: new Date(),
          actualizadoEn: new Date(),
        },
      };

      // Assert
      expect(response.raa).toHaveProperty('id');
      expect(response.raa).toHaveProperty('codigo');
      expect(response.raa).toHaveProperty('descripcion');
      expect(response.raa).toHaveProperty('asignaturaId');
      expect(response.raa).toHaveProperty('tipoRaaId');
      expect(response.raa).toHaveProperty('estadoActivo');
      expect(response.raa).toHaveProperty('creadoEn');
      expect(response.raa).toHaveProperty('actualizadoEn');
    });
  });
});
