import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Iniciar sesión con selección de rol',
    description: 'Autentica un usuario y devuelve un token JWT válido. Los usuarios pueden tener múltiples roles asignados, pero deben seleccionar uno específico para la sesión. El sistema valida que el rol seleccionado esté entre los roles asignados al usuario. También se puede cambiar de rol durante la sesión usando el endpoint /auth/switch-role.',
  })
  @ApiBody({ 
    type: LoginDto,
    description: 'Credenciales de acceso del usuario incluyendo el rol obligatorio para validación',
  })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['correo must be an email', 'contrasena should not be empty', 'rol should not be empty', 'rol must be a valid enum value']
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales incorrectas o rol no válido para el usuario',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { 
          type: 'string', 
          examples: {
            invalidCredentials: {
              value: 'Credenciales inválidas',
              description: 'Cuando el email o contraseña son incorrectos'
            },
            invalidRole: {
              value: 'El rol seleccionado no corresponde al usuario',
              description: 'Cuando el rol no coincide con el rol asignado al usuario'
            }
          }
        },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }
}