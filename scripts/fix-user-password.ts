import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsuariosService } from '../src/usuarios/usuarios.service';
import * as bcrypt from 'bcrypt';

async function updateUserPassword() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usuariosService = app.get(UsuariosService);

  try {
    // Buscar el usuario por correo
    const user = await usuariosService.findByEmail('juan.perez@epn.edu.ec');
    
    if (!user) {
      console.log('❌ Usuario juan.perez@epn.edu.ec no encontrado');
      return;
    }

    console.log('👤 Usuario encontrado:', user.nombres, user.apellidos);
    
    // Encriptar la contraseña correctamente
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Actualizar directamente en la base de datos (sin hooks para evitar doble encriptación)
    await user.update({ contrasena: hashedPassword }, { hooks: false });
    
    console.log('✅ Contraseña actualizada correctamente');
    console.log('📧 Correo: juan.perez@epn.edu.ec');
    console.log('🔑 Contraseña: password123');
    
    // Verificar que la contraseña funcione
    const updatedUser = await usuariosService.findByEmail('juan.perez@epn.edu.ec');
    if (updatedUser) {
      const isValid = await updatedUser.validatePassword('password123');
      console.log('🔍 Verificación de contraseña:', isValid ? '✅ Correcta' : '❌ Incorrecta');
    }
    
  } catch (error) {
    console.error('❌ Error al actualizar contraseña:', error.message);
  } finally {
    await app.close();
  }
}

updateUserPassword();