import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { correo, contrasena, rol } = loginDto;
    
    const user = await this.usuariosService.findByEmail(correo);
    
    if (!user || !user.estadoActivo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await user.validatePassword(contrasena);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Validar que el rol seleccionado corresponda al usuario
    if (user.rol !== rol) {
      throw new UnauthorizedException('El rol seleccionado no corresponde al usuario');
    }

    const payload: JwtPayload = {
      sub: user.id,
      correo: user.correo,
      rol: user.rol,
    };

    const access_token = this.jwtService.sign(payload);

    // Registrar evento de login exitoso
    this.auditoriaService.registrarLoginExitoso(user.id, user.correo);

    return {
      access_token,
      user: {
        id: user.id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        correo: user.correo,
        rol: user.rol,
        estadoActivo: user.estadoActivo,
      },
    };
  }

  async validateUser(userId: number) {
    return this.usuariosService.findOne(userId);
  }
}