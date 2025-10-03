export interface JwtPayload {
  sub: number;
  correo: string;
  rol: string; // Rol activo en la sesión
  roles?: string[]; // Todos los roles disponibles del usuario
  iat?: number;
  exp?: number;
}