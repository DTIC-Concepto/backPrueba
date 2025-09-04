# Usar la imagen oficial de Node.js 18 LTS como base
FROM node:18-alpine AS builder

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar TODAS las dependencias (incluye devDependencies necesarias para build)
RUN npm ci && npm cache clean --force

# Copiar el código fuente
COPY src/ ./src/

# Construir la aplicación
RUN npm run build

# ============================
# Etapa de producción
# ============================
FROM node:18-alpine AS production

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar la aplicación construida desde la etapa builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Crear directorio para logs
RUN mkdir -p /app/logs && chown nestjs:nodejs /app/logs

# Cambiar al usuario no-root
USER nestjs

# Exponer el puerto 3000
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Crear script de health check
USER root
RUN echo 'const http = require("http"); \
const options = { host: "localhost", port: process.env.PORT || 3000, timeout: 2000 }; \
const request = http.request(options, (res) => { \
  process.exitCode = (res.statusCode === 200) ? 0 : 1; \
  process.exit(); \
}); \
request.on("error", function() { process.exit(1); }); \
request.end();' > healthcheck.js

USER nestjs

# Comando para iniciar la aplicación
CMD ["node", "dist/main"]
