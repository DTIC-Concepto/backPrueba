import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsuariosService } from '../src/usuarios/usuarios.service';
import { RolEnum } from '../src/common/enums/rol.enum';
import { CreateUsuarioDto } from '../src/usuarios/dto/create-usuario.dto';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usuariosService = app.get(UsuariosService);

  try {
    // Verificar si ya existe el usuario admin
    const existingUser = await usuariosService.findByEmail('admin@poliacredita.edu.ec');
    
    if (existingUser) {
      console.log('✅ Usuario administrador ya existe');
      return;
    }

    // Crear usuario administrador
    const adminUser: CreateUsuarioDto = {
      nombres: 'Administrador',
      apellidos: 'del Sistema',
      cedula: '1234567890',
      correo: 'admin@epn.edu.ec',
      contrasena: 'admin123',
      rol: RolEnum.ADMINISTRADOR,
      estadoActivo: true,
    };

    await usuariosService.create(adminUser);
    console.log('✅ Usuario administrador creado exitosamente');
    console.log('📧 Correo: admin@poliacredita.edu.ec');
    console.log('🔑 Contraseña: admin123');
    
  } catch (error) {
    console.error('❌ Error al crear usuario administrador:', error.message);
  } finally {
    await app.close();
  }
}

bootstrap();