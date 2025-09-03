# 🐳 Docker Setup - Poliacredita API

Este proyecto incluye configuración completa de Docker para ejecutar tanto la API de NestJS como PostgreSQL en contenedores.

## 📋 Requisitos Previos

- Docker Engine 20.10+
- Docker Compose 2.0+
- Al menos 2GB de RAM disponible

## 🚀 Inicio Rápido

### Producción (Recomendado para Frontend)

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd prueba-concepto-final

# 2. Construir y ejecutar el stack completo
docker-compose up -d

# 3. Verificar que los servicios estén corriendo
docker-compose ps

# 4. Ver logs en tiempo real
docker-compose logs -f api
```

**URLs disponibles:**
- 🌐 API: http://localhost:3000
- 📚 Swagger: http://localhost:3000/api/docs
- 🗄️ Adminer (DB Admin): http://localhost:8080

### Desarrollo

```bash
# Usar la configuración de desarrollo con hot-reload
docker-compose -f docker-compose.dev.yml up -d

# Ver logs de desarrollo
docker-compose -f docker-compose.dev.yml logs -f api-dev
```

**URLs de desarrollo:**
- 🌐 API Dev: http://localhost:3001
- 📚 Swagger Dev: http://localhost:3001/api/docs
- 🗄️ Adminer Dev: http://localhost:8081

## 🛠️ Comandos Útiles

### Gestión de Contenedores

```bash
# Iniciar servicios
docker-compose up -d

# Parar servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Ver estado de servicios
docker-compose ps

# Ver logs
docker-compose logs -f [service-name]

# Reconstruir imagen de la API
docker-compose build api

# Limpiar todo (⚠️ elimina datos de la BD)
docker-compose down -v --remove-orphans
```

### Base de Datos

```bash
# Conectar a PostgreSQL desde línea de comandos
docker-compose exec postgres psql -U postgres -d poliacredita_db

# Hacer backup de la base de datos
docker-compose exec postgres pg_dump -U postgres poliacredita_db > backup.sql

# Restaurar backup
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d poliacredita_db
```

### Depuración

```bash
# Acceder al contenedor de la API
docker-compose exec api sh

# Ver logs detallados de la API
docker-compose logs -f --tail=100 api

# Verificar salud de los servicios
docker-compose exec api wget --spider http://localhost:3000/health
docker-compose exec postgres pg_isready -U postgres
```

## 🔧 Configuración

### Variables de Entorno

Copia el archivo de ejemplo y personaliza:

```bash
cp .env.docker.example .env.docker
# Edita .env.docker con tus configuraciones
```

### Puertos

| Servicio | Puerto Host | Puerto Contenedor | Descripción |
|----------|-------------|-------------------|-------------|
| API      | 3000        | 3000              | Aplicación NestJS |
| PostgreSQL | 5432      | 5432              | Base de datos |
| Adminer  | 8080        | 8080              | Admin de BD |
| API Dev  | 3001        | 3000              | API en desarrollo |
| Adminer Dev | 8081     | 8080              | Admin BD dev |

## 📊 Monitoreo

### Health Checks

Los servicios incluyen health checks automáticos:

```bash
# Verificar salud de todos los servicios
docker-compose ps

# Ver detalles de health check
docker inspect poliacredita-api --format='{{.State.Health.Status}}'
```

### Logs

```bash
# Logs de todos los servicios
docker-compose logs

# Logs de un servicio específico
docker-compose logs api

# Logs en tiempo real con filtro
docker-compose logs -f api | grep ERROR
```

## 🔒 Seguridad

### Credenciales por Defecto

⚠️ **IMPORTANTE**: Cambia estas credenciales en producción:

- **PostgreSQL**: 
  - Usuario: `postgres`
  - Contraseña: `postgres`
  - Base de datos: `poliacredita_db`

### Acceso a Adminer

1. Ve a http://localhost:8080
2. Servidor: `postgres`
3. Usuario: `postgres`
4. Contraseña: `postgres`
5. Base de datos: `poliacredita_db`

## 🔄 Integración con Frontend

Para que el frontend Angular/React pueda conectarse:

### 1. Variables de Entorno del Frontend

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  apiVersion: 'v1'
};
```

### 2. Configuración de CORS

La API está configurada para aceptar peticiones desde:
- `http://localhost:4200` (Angular default)
- `http://localhost:3000` (React default)

### 3. Endpoints Disponibles

```bash
# Listar todos los endpoints
curl http://localhost:3000/api/docs

# Ejemplo de uso
curl -X GET "http://localhost:3000/raa" \
  -H "Content-Type: application/json"
```

## 🚨 Solución de Problemas

### Error: Puerto ya en uso

```bash
# Verificar qué está usando el puerto
lsof -i :3000

# Cambiar puerto en docker-compose.yml
ports:
  - "3001:3000"  # Usar puerto 3001 en host
```

### Error: Base de datos no accesible

```bash
# Verificar logs de PostgreSQL
docker-compose logs postgres

# Verificar conectividad
docker-compose exec api ping postgres
```

### Error: Contenedor no inicia

```bash
# Ver logs detallados
docker-compose logs api

# Reconstruir imagen
docker-compose build --no-cache api

# Verificar recursos del sistema
docker system df
```

### Limpiar Cache de Docker

```bash
# Limpiar imágenes no utilizadas
docker image prune

# Limpiar todo el cache
docker system prune -a

# Limpiar volúmenes huérfanos
docker volume prune
```

## 📝 Notas Adicionales

- Los datos de PostgreSQL se persisten en un volumen Docker
- Los logs de la aplicación se guardan en `./logs/`
- La aplicación se reconstruye automáticamente en desarrollo
- Health checks monitorean el estado de los servicios
- Adminer está incluido para gestión fácil de la BD

## 🤝 Para Desarrolladores

### Desarrollo Local con Docker

1. **Primera vez:**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **Subsecuentes ejecuciones:**
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

3. **Solo base de datos:**
   ```bash
   docker-compose up postgres
   # Y ejecuta la app localmente con npm run start:dev
   ```

### Testing

```bash
# Ejecutar tests dentro del contenedor
docker-compose exec api npm test

# Tests con cobertura
docker-compose exec api npm run test:cov
```
