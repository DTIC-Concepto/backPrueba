export interface JwtPayload {
  sub: number;
  correo: string;
  rol: string;
  iat?: number;
  exp?: number;
}