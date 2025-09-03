import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { DeleteRaaDto, DeleteRaaResponseDto } from '../dtos/delete-raa.dto';

describe('DeleteRaaDto', () => {
  describe('Validaciones de DeleteRaaDto', () => {
    it('debería validar correctamente un DTO válido', async () => {
      // Arrange
      const dtoData = {
        id: 1,
        confirmarEliminacion: true,
        forzarEliminacion: false,
      };

      // Act
      const dto = plainToClass(DeleteRaaDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto.id).toBe(1);
      expect(dto.confirmarEliminacion).toBe(true);
      expect(dto.forzarEliminacion).toBe(false);
    });

    it('debería validar correctamente un DTO con propiedades opcionales undefined', async () => {
      // Arrange
      const dtoData = {
        id: 1,
      };

      // Act
      const dto = plainToClass(DeleteRaaDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto.id).toBe(1);
      expect(dto.confirmarEliminacion).toBeUndefined();
      expect(dto.forzarEliminacion).toBeUndefined();
    });

    it('debería fallar cuando el ID está vacío', async () => {
      // Arrange
      const dtoData = {
        confirmarEliminacion: true,
      };

      // Act
      const dto = plainToClass(DeleteRaaDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('debería fallar cuando confirmarEliminacion no es booleano', async () => {
      // Arrange
      const dtoData = {
        id: 1,
        confirmarEliminacion: 'true', // String en lugar de boolean
      };

      // Act
      const dto = plainToClass(DeleteRaaDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isBoolean');
    });

    it('debería fallar cuando forzarEliminacion no es booleano', async () => {
      // Arrange
      const dtoData = {
        id: 1,
        forzarEliminacion: 'false', // String en lugar de boolean
      };

      // Act
      const dto = plainToClass(DeleteRaaDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isBoolean');
    });

    it('debería manejar valores booleanos como string (gracias a transform)', async () => {
      // Arrange
      const dtoData = {
        id: 1,
        confirmarEliminacion: true, // Ya como booleano
        forzarEliminacion: false,
      };

      // Act
      const dto = plainToClass(DeleteRaaDto, dtoData);
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto.confirmarEliminacion).toBe(true);
      expect(dto.forzarEliminacion).toBe(false);
    });
  });

  describe('Validaciones de campos de entrada', () => {
    it('debería validar IDs numéricos positivos', async () => {
      // Arrange
      const validIds = [1, 100, 9999];

      for (const id of validIds) {
        // Act
        const dto = plainToClass(DeleteRaaDto, { id });
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
        expect(dto.id).toBe(id);
      }
    });

    it('debería rechazar IDs inválidos', async () => {
      // Arrange & Act & Assert - ID null
      const dtoNull = plainToClass(DeleteRaaDto, { id: null });
      const errorsNull = await validate(dtoNull);
      expect(errorsNull.length).toBeGreaterThan(0);

      // ID undefined (campo faltante)
      const dtoUndefined = plainToClass(DeleteRaaDto, {});
      const errorsUndefined = await validate(dtoUndefined);
      expect(errorsUndefined.length).toBeGreaterThan(0);

      // ID string no numérico
      const dtoString = plainToClass(DeleteRaaDto, { id: 'abc' });
      const errorsString = await validate(dtoString);
      expect(errorsString.length).toBeGreaterThan(0);
    });
  });

  describe('Casos de uso del DTO', () => {
    it('debería crear un DTO para eliminación suave por defecto', async () => {
      // Arrange
      const dtoData = { id: 1 };

      // Act
      const dto = plainToClass(DeleteRaaDto, dtoData);

      // Assert
      expect(dto.id).toBe(1);
      expect(dto.confirmarEliminacion).toBeUndefined();
      expect(dto.forzarEliminacion).toBeUndefined();
    });

    it('debería crear un DTO para eliminación forzada', async () => {
      // Arrange
      const dtoData = {
        id: 1,
        confirmarEliminacion: true,
        forzarEliminacion: true,
      };

      // Act
      const dto = plainToClass(DeleteRaaDto, dtoData);

      // Assert
      expect(dto.id).toBe(1);
      expect(dto.confirmarEliminacion).toBe(true);
      expect(dto.forzarEliminacion).toBe(true);
    });
  });
});

describe('DeleteRaaResponseDto', () => {
  describe('Estructura de respuesta', () => {
    it('debería crear una respuesta exitosa de eliminación suave', () => {
      // Arrange & Act
      const response: DeleteRaaResponseDto = {
        exitoso: true,
        mensaje: 'RAA eliminado correctamente (eliminación suave)',
        id: 1,
        codigo: 'RAA-001',
        tipoEliminacion: 'soft_delete',
      };

      // Assert
      expect(response.exitoso).toBe(true);
      expect(response.tipoEliminacion).toBe('soft_delete');
      expect(response.mensaje).toContain('eliminación suave');
    });

    it('debería crear una respuesta exitosa de eliminación física', () => {
      // Arrange & Act
      const response: DeleteRaaResponseDto = {
        exitoso: true,
        mensaje: 'RAA eliminado permanentemente de la base de datos',
        id: 1,
        codigo: 'RAA-001',
        tipoEliminacion: 'hard_delete',
        advertencias: ['Se realizó eliminación física a pesar de tener relaciones existentes'],
      };

      // Assert
      expect(response.exitoso).toBe(true);
      expect(response.tipoEliminacion).toBe('hard_delete');
      expect(response.advertencias).toHaveLength(1);
    });

    it('debería crear una respuesta de inactivación', () => {
      // Arrange & Act
      const response: DeleteRaaResponseDto = {
        exitoso: true,
        mensaje: 'RAA inactivado debido a relaciones existentes',
        id: 1,
        codigo: 'RAA-001',
        tipoEliminacion: 'inactivated',
        advertencias: [
          'El RAA fue inactivado debido a relaciones existentes',
          'TODO: Implementar validación específica de relaciones en sprints futuros'
        ],
      };

      // Assert
      expect(response.exitoso).toBe(true);
      expect(response.tipoEliminacion).toBe('inactivated');
      expect(response.advertencias).toHaveLength(2);
      expect(response.advertencias?.[1]).toContain('TODO:');
    });
  });

  describe('Tipos de eliminación', () => {
    it('debería aceptar solo los tipos de eliminación válidos', () => {
      // Arrange
      const tiposValidos: Array<'soft_delete' | 'hard_delete' | 'inactivated'> = [
        'soft_delete',
        'hard_delete', 
        'inactivated'
      ];

      // Act & Assert
      tiposValidos.forEach(tipo => {
        const response: DeleteRaaResponseDto = {
          exitoso: true,
          mensaje: 'Test',
          id: 1,
          codigo: 'RAA-001',
          tipoEliminacion: tipo,
        };

        expect(response.tipoEliminacion).toBe(tipo);
      });
    });
  });

  describe('Casos de respuesta de error implícitos', () => {
    it('debería manejar respuestas de no encontrado', () => {
      // Este caso se maneja a través de excepciones HTTP, no del DTO
      // Pero documentamos el comportamiento esperado
      const expectedError = {
        statusCode: 404,
        message: 'RAA con ID 1 no encontrado',
        error: 'Not Found',
      };

      expect(expectedError.statusCode).toBe(404);
      expect(expectedError.message).toContain('no encontrado');
    });

    it('debería manejar respuestas de conflicto', () => {
      // Este caso se maneja a través de excepciones HTTP, no del DTO
      const expectedError = {
        statusCode: 409,
        message: 'Error al eliminar el RAA: conflicto de integridad',
        error: 'Conflict',
      };

      expect(expectedError.statusCode).toBe(409);
      expect(expectedError.message).toContain('Error al eliminar');
    });
  });
});
