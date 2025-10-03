import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RolEnum } from '../common/enums/rol.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { correo, contrasena, rol } = loginDto;
    
    // Obtener usuario básico
    const user = await this.usuariosService.findByEmail(correo);
    
    if (!user || !user.estadoActivo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await user.validatePassword(contrasena);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Obtener roles directamente de la tabla usuario_roles
    const usuarioRoles = await this.usuariosService.findUserRoles(user.id);
    
    console.log('🎭 Roles encontrados para usuario ID', user.id, ':', usuarioRoles.map(ur => ({ 
      id: ur.id,
      usuarioId: ur.usuarioId,
      rol: ur.rol,
      activo: ur.activo
    })));

    // Obtener todos los roles activos del usuario ÚNICAMENTE desde la tabla usuario_roles
    let userRoles: string[] = [];
    
    if (usuarioRoles && usuarioRoles.length > 0) {
      userRoles = usuarioRoles
        .filter(ur => ur.activo === true)  // Solo roles activos
        .map(ur => ur.rol);
      
      console.log('Roles activos del usuario:', userRoles);
    } else {
      console.log('No se encontraron usuarioRoles o el array está vacío');
      // Si no hay roles en usuario_roles, usar el rol principal como fallback
      userRoles = [user.rol];
    }

    console.log('Todos los roles disponibles para el usuario:', userRoles);
    console.log('Rol solicitado:', rol);

    // Validar que el rol seleccionado esté entre los roles del usuario
    if (!userRoles.includes(rol)) {
      const availableRoles = userRoles.join(', ');
      throw new UnauthorizedException(
        `El rol seleccionado '${rol}' no está asignado al usuario. Roles disponibles: ${availableRoles}`
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      correo: user.correo,
      rol: rol, // El rol con el que se autentica (seleccionado)
      roles: userRoles as string[], // Todos los roles disponibles
    };

    const access_token = this.jwtService.sign(payload);

    // Registrar evento de login exitoso con el rol seleccionado
    this.auditoriaService.registrarLoginExitoso(user.id, user.correo);

    return {
      access_token,
      user: {
        id: user.id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        correo: user.correo,
        rol: rol, // Rol seleccionado para esta sesión
        rolPrincipal: user.rol, // Rol principal del usuario
        rolesDisponibles: userRoles as RolEnum[], // Todos los roles del usuario
        estadoActivo: user.estadoActivo,
      },
    };
  }

  async validateUser(userId: number) {
    return this.usuariosService.findOne(userId);
  }
}