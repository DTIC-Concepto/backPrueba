import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensaje de error',
    oneOf: [
      { type: 'string', example: 'Validation failed' },
      { 
        type: 'array', 
        items: { type: 'string' },
        example: ['email must be an email', 'password should not be empty']
      }
    ],
  })
  message: string | string[];

  @ApiProperty({
    description: 'Tipo de error',
    example: 'Bad Request',
  })
  error: string;

  @ApiProperty({
    description: 'Timestamp del error',
    example: '2024-09-03T00:00:00.000Z',
    required: false,
  })
  timestamp?: string;

  @ApiProperty({
    description: 'Ruta donde ocurrió el error',
    example: '/api/auth/login',
    required: false,
  })
  path?: string;
}