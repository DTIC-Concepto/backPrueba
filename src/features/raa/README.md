# Módulo RAA - Eliminación de Resultados de Aprendizaje de Asignatura

## Descripción

Este módulo implementa la funcionalidad completa para la gestión de Resultados de Aprendizaje de Asignatura (RAA), con énfasis en la historia de usuario "HU: Eliminar RAA". El módulo incluye operaciones CRUD completas y diferentes estrategias de eliminación según las relaciones existentes.

## Estructura del Módulo

```
src/features/raa/
├── controllers/
│   └── raa.controller.ts          # Controlador REST para endpoints de RAA
├── services/
│   └── raa.service.ts             # Lógica de negocio para RAA
├── models/
│   └── raa.model.ts              # Modelo Sequelize para la entidad RAA
├── dtos/
│   ├── raa.dto.ts                # DTOs para crear, actualizar y filtrar RAA
│   └── delete-raa.dto.ts         # DTOs específicos para eliminación de RAA
├── __tests__/
│   ├── raa.controller.spec.ts    # Pruebas unitarias del controlador
│   ├── raa.service.spec.ts       # Pruebas unitarias del servicio
│   └── delete-raa.dto.spec.ts    # Pruebas de validación de DTOs
├── index.ts                      # Archivo barrel para exportaciones
└── raa.module.ts                 # Módulo NestJS
```

## Funcionalidades Implementadas

### 1. Eliminación de RAA (Historia de Usuario Principal)

#### Endpoint: `DELETE /raa/:id`

**Tipos de Eliminación Soportados:**

1. **Eliminación Suave (Soft Delete)** - Por defecto
   - Marca el registro como eliminado pero mantiene los datos
   - Preserva la trazabilidad histórica
   - Permite recuperación posterior

2. **Eliminación Física (Hard Delete)** - Con `forzarEliminacion: true`
   - Elimina permanentemente el registro de la base de datos
   - No reversible
   - Se ejecuta solo si se fuerza explícitamente

3. **Inactivación** - Cuando existen relaciones
   - Cambia el estado a inactivo en lugar de eliminar
   - Preserva integridad referencial
   - Mantiene relaciones intactas

#### Parámetros de Entrada:

```typescript
{
  "id": 1,                          // Obligatorio: ID del RAA
  "confirmarEliminacion": true,     // Opcional: Confirmación explícita
  "forzarEliminacion": false        // Opcional: Forzar eliminación física
}
```

#### Respuesta de Éxito:

```typescript
{
  "exitoso": true,
  "mensaje": "RAA eliminado correctamente (eliminación suave)",
  "id": 1,
  "codigo": "RAA-001",
  "tipoEliminacion": "soft_delete",
  "advertencias": ["mensaje opcional si aplica"]
}
```

### 2. Operaciones CRUD Adicionales

- **GET /raa/:id** - Obtener RAA por ID
- **GET /raa** - Listar RAAs con filtros opcionales
- **POST /raa** - Crear nuevo RAA
- **PUT /raa/:id** - Actualizar RAA existente

## Validaciones Implementadas

### DeleteRaaDto
- `id`: Obligatorio, entero, mayor a 0
- `confirmarEliminacion`: Opcional, booleano
- `forzarEliminacion`: Opcional, booleano

### CreateRaaDto
- `codigo`: Obligatorio, string único
- `descripcion`: Obligatorio, texto
- `asignaturaId`: Obligatorio, entero positivo
- `tipoRaaId`: Obligatorio, entero positivo
- `estadoActivo`: Opcional, booleano (default: true)

## Manejo de Errores

### Códigos de Estado HTTP

- **200 OK**: Eliminación exitosa
- **400 Bad Request**: RAA ya eliminado o inactivo, parámetros inválidos
- **404 Not Found**: RAA no encontrado
- **409 Conflict**: Error durante la eliminación, código duplicado

### Ejemplos de Respuestas de Error

```typescript
// RAA no encontrado
{
  "statusCode": 404,
  "message": "RAA con ID 1 no encontrado",
  "error": "Not Found"
}

// RAA ya eliminado
{
  "statusCode": 400,
  "message": "El RAA con ID 1 ya ha sido eliminado anteriormente",
  "error": "Bad Request"
}

// Conflicto durante eliminación
{
  "statusCode": 409,
  "message": "Error al eliminar el RAA: conflicto de integridad",
  "error": "Conflict"
}
```

## Modelo de Base de Datos

### Tabla: `raa`

```sql
CREATE TABLE raa (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT NOT NULL,
  asignatura_id INTEGER NOT NULL,
  tipo_raa_id INTEGER NOT NULL,
  estado_activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW(),
  eliminado_en TIMESTAMP NULL  -- Para soft deletes
);
```

### Características del Modelo
- **Soft Deletes**: Habilitado mediante `paranoid: true`
- **Timestamps**: Automáticos para auditoría
- **Unique Constraints**: Código único por RAA
- **Foreign Keys**: Relaciones con Asignatura y TipoRAA

## Pruebas Unitarias

### Cobertura de Pruebas

#### RaaService (25 pruebas)
- ✅ Eliminación exitosa con diferentes estrategias
- ✅ Manejo de errores (RAA no encontrado, ya eliminado, inactivo)
- ✅ Operaciones CRUD completas
- ✅ Validación de relaciones existentes
- ✅ Casos edge y manejo de excepciones

#### RaaController (16 pruebas)
- ✅ Endpoints REST completos
- ✅ Validación de parámetros de entrada
- ✅ Manejo de códigos de estado HTTP
- ✅ Transformación de DTOs
- ✅ Propagación de errores del servicio

#### DeleteRaaDto (16 pruebas)
- ✅ Validaciones de campos obligatorios
- ✅ Validaciones de tipos de datos
- ✅ Casos de uso específicos
- ✅ Estructura de respuesta
- ✅ Manejo de campos opcionales

### Ejecutar Pruebas

```bash
# Todas las pruebas
npm test

# Solo pruebas del módulo RAA
npm test src/features/raa

# Pruebas específicas
npm test src/features/raa/__tests__/raa.service.spec.ts
npm test src/features/raa/__tests__/raa.controller.spec.ts
npm test src/features/raa/__tests__/delete-raa.dto.spec.ts
```

## TODO - Implementaciones Futuras

### Verificación de Relaciones
```typescript
// En RaaService.verificarRelaciones()
// TODO: definir reglas específicas en sprints futuros
// - Verificar relaciones con ResultadoRaa
// - Verificar relaciones con otras entidades relevantes
// - Implementar lógica de negocio específica para cada relación
// - Definir estrategias de eliminación por tipo de relación
```

### Reglas de Negocio Específicas
- Definir qué entidades bloquean la eliminación física
- Implementar cascada de inactivación para entidades relacionadas
- Establecer permisos de eliminación por rol de usuario
- Configurar auditoría avanzada para eliminaciones

## Configuración

### Variables de Entorno

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=poliacredita_db

# Aplicación
PORT=3000
NODE_ENV=development
```

### Dependencias

- `@nestjs/sequelize`: ORM y conexión a PostgreSQL
- `sequelize-typescript`: Decoradores para modelos
- `class-validator`: Validaciones de DTOs
- `class-transformer`: Transformación de objetos
- `@nestjs/swagger`: Documentación de API

## Uso del API

### Ejemplo de Eliminación Suave

```bash
curl -X DELETE "http://localhost:3000/raa/1" \
  -H "Content-Type: application/json" \
  -d '{
    "confirmarEliminacion": true
  }'
```

### Ejemplo de Eliminación Física

```bash
curl -X DELETE "http://localhost:3000/raa/1" \
  -H "Content-Type: application/json" \
  -d '{
    "confirmarEliminacion": true,
    "forzarEliminacion": true
  }'
```

### Ejemplo de Listado con Filtros

```bash
curl -X GET "http://localhost:3000/raa?estadoActivo=true&asignaturaId=1"
```

## Arquitectura y Patrones

### Patrones Implementados
- **Repository Pattern**: A través de Sequelize
- **DTO Pattern**: Para validación y transformación
- **Service Layer**: Lógica de negocio separada
- **Dependency Injection**: Inyección de dependencias NestJS
- **Error Handling**: Manejo centralizado de excepciones

### Principios SOLID
- **SRP**: Cada clase tiene una responsabilidad específica
- **OCP**: Extensible para nuevas funcionalidades sin modificar código existente
- **LSP**: Implementaciones intercambiables de interfaces
- **ISP**: Interfaces específicas por funcionalidad
- **DIP**: Dependencias de abstracciones, no de concreciones

---

**Nota**: Este módulo está diseñado para cumplir con los estándares de arquitectura del sistema Poliacredita y es completamente funcional para la historia de usuario "HU: Eliminar RAA".
