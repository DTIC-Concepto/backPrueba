import { Controller, Get, UseGuards } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { GetUser } from './auth/decorators/get-user.decorator';
import { RolEnum } from './common/enums/rol.enum';
import { UsuarioModel } from './usuarios/models/usuario.model';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ 
    status: 200, 
    description: 'API health status',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2024-09-03T00:00:00.000Z',
        uptime: 12345,
        environment: 'production',
        version: '1.0.0'
      }
    }
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: 'connected' // TODO: Add real DB health check
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ 
    summary: 'Obtener perfil del usuario actual',
    description: 'Devuelve la información del usuario autenticado actualmente'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Perfil obtenido exitosamente',
    schema: {
      example: {
        message: 'Perfil de usuario autenticado',
        user: {
          id: 1,
          nombres: 'Juan Carlos',
          apellidos: 'Pérez González',
          correo: 'juan.perez@epn.edu.ec',
          rol: 'PROFESOR',
          estadoActivo: true
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o no proporcionado'
  })
  getProfile(@GetUser() user: UsuarioModel) {
    return {
      message: 'Perfil de usuario autenticado',
      user: user,
    };
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolEnum.DGIP)
  @ApiBearerAuth('bearer')
  @ApiOperation({ 
    summary: 'Datos administrativos - Solo DGIP',
    description: 'Endpoint exclusivo para usuarios con rol DGIP'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Datos administrativos obtenidos exitosamente',
    schema: {
      example: {
        message: 'Datos administrativos - Solo para DGIP',
        user: {
          id: 1,
          nombres: 'Admin',
          apellidos: 'Sistema',
          correo: 'admin@epn.edu.ec',
          rol: 'DGIP',
          estadoActivo: true
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o no proporcionado'
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado - Se requiere rol DGIP'
  })
  getAdminData(@GetUser() user: UsuarioModel) {
    return {
      message: 'Datos administrativos - Solo para DGIP',
      user: user,
    };
  }
}
