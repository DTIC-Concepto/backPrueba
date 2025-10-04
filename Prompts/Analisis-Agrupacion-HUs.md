# Análisis y Agrupación de Historias de Usuario por Funcionalidad

## Resumen Ejecutivo

Después de analizar todas las Historias de Usuario del proyecto **ProyectoDTIC**, se han identificado **patrones claros de funcionalidad** que se pueden agrupar por **endpoints/APIs similares** y **operaciones CRUD** relacionadas. Esta agrupación optimizará el desarrollo y evitará duplicación de esfuerzos.

## Grupos Funcionales Identificados

### 🏢 **GRUPO 1: GESTIÓN DE FACULTADES**

**Endpoint Base:** `/api/facultades`

| HU ID | Título | Funcionalidad Core |
|-------|--------|-------------------|
| 2313 | HU: Gestionar Facultades | CRUD completo de facultades |
| 2407 | HU: Gestionar Facultades | CRUD completo de facultades (duplicada) |
| 2780 | HU: listar facultades | GET /facultades con filtros |
| 5094 | HU: Listar Facultades Registradas | GET /facultades con paginación |
| 5097 | HU: Filtrar Facultades | GET /facultades?search={query} |
| 5100 | HU: Registrar Nueva Facultad | POST /facultades |
| 6015 | HU: Listar Facultades Registradas | GET /facultades (duplicada) |
| 6019 | HU: Registrar Nueva Facultad | POST /facultades (duplicada) |
| 6241 | HU: Listar Facultades Registradas | GET /facultades (duplicada) |
| 6261 | HU: Registrar Nueva Facultad | POST /facultades (duplicada) |
| 6477 | HU: Listar Facultades Registradas | GET /facultades (duplicada) |
| 6483 | HU: Registrar Nueva Facultad | POST /facultades (duplicada) |

**APIs Necesarias:**
```typescript
GET    /api/facultades              // Listar con filtros y paginación
POST   /api/facultades              // Crear nueva facultad
PUT    /api/facultades/:id          // Actualizar facultad
DELETE /api/facultades/:id          // Eliminar facultad
GET    /api/facultades/:id          // Obtener facultad específica
```

**Filtros Comunes Identificados:**
- Búsqueda por código o nombre
- Filtro por número de carreras asociadas
- Filtro por estado (activo/inactivo)
- Paginación estándar

---

### 🎓 **GRUPO 2: GESTIÓN DE CARRERAS**

**Endpoint Base:** `/api/carreras`

| HU ID | Título | Funcionalidad Core |
|-------|--------|-------------------|
| 2438 | HU: Gestionar Carreras | CRUD completo de carreras |
| 2410 | HU: Gestionar Carreras | CRUD completo de carreras (duplicada) |
| 2783 | HU: Listar Carreras | GET /carreras con filtros |
| 5104 | HU: Listar Carreras Registradas | GET /carreras con paginación |
| 5108 | HU: Registrar Nueva Carrera | POST /carreras |
| 6021 | HU: Listar Carreras Registradas | GET /carreras (duplicada) |
| 6026 | HU: Registrar Nueva Carrera | POST /carreras (duplicada) |
| 6246 | HU: Listar Carreras Registradas | GET /carreras (duplicada) |
| 6262 | HU: Registrar Nueva Carrera | POST /carreras (duplicada) |
| 6485 | HU: Listar Carreras Registradas | GET /carreras (duplicada) |
| 6490 | HU: Registrar Nueva Carrera | POST /carreras (duplicada) |

**APIs Necesarias:**
```typescript
GET    /api/carreras               // Listar con filtros y paginación
POST   /api/carreras               // Crear nueva carrera
PUT    /api/carreras/:id           // Actualizar carrera
DELETE /api/carreras/:id           // Eliminar carrera
GET    /api/carreras/:id           // Obtener carrera específica
GET    /api/carreras/by-facultad/:facultadId  // Carreras por facultad
```

**Filtros Comunes Identificados:**
- Búsqueda por código o nombre
- Filtro por facultad
- Filtro por modalidad (Presencial, Virtual, Semipresencial)
- Filtro por estado (activo/inactivo)
- Filtro por coordinador
- Paginación estándar

---

### 👥 **GRUPO 3: GESTIÓN DE USUARIOS**

**Endpoint Base:** `/api/usuarios`

| HU ID | Título | Funcionalidad Core |
|-------|--------|-------------------|
| 2781 | HU: Listar profesores | GET /usuarios?rol=profesor |
| 5090 | HU: Listar Usuarios Registrados | GET /usuarios con filtros |
| 5102 | HU: Registrar Nuevo Usuario | POST /usuarios |
| 6007 | HU: Listar Usuarios Registrados | GET /usuarios (duplicada) |
| 6009 | HU: Registrar Nuevo Usuario | POST /usuarios (duplicada) |
| 6233 | HU: Registrar Nuevo Usuario | POST /usuarios (duplicada) |
| 6234 | HU: Listar Usuarios Registrados | GET /usuarios (duplicada) |
| 6469 | HU: Listar Usuarios Registrados | GET /usuarios (duplicada) |
| 6470 | HU: Registrar Nuevo Usuario | POST /usuarios (duplicada) |
| 5763 | HU: Listar Usuarios Registrados | GET /usuarios (duplicada) |
| 5764 | HU: Registrar Nuevo Usuario | POST /usuarios (duplicada) |

**APIs Necesarias:**
```typescript
GET    /api/usuarios               // Listar con filtros y paginación
POST   /api/usuarios               // Crear nuevo usuario
PUT    /api/usuarios/:id           // Actualizar usuario
DELETE /api/usuarios/:id           // Eliminar usuario
GET    /api/usuarios/:id           // Obtener usuario específico
GET    /api/usuarios/by-rol/:rol   // Usuarios por rol
PUT    /api/usuarios/:id/estado    // Cambiar estado usuario
```

**Filtros Comunes Identificados:**
- Búsqueda por nombre, email o cédula
- Filtro por rol (Administrador, Profesor, Coordinador, etc.)
- Filtro por estado (Activo/Inactivo)
- Filtro por facultad
- Paginación estándar

---

### 👤 **GRUPO 4: PERFIL PERSONAL**

**Endpoint Base:** `/api/usuarios/profile`

| HU ID | Título | Funcionalidad Core |
|-------|--------|-------------------|
| 5115 | HU: Cambiar Contraseña Personal | PUT /usuarios/profile/password |
| 5116 | HU: Visualizar Perfil Personal | GET /usuarios/profile |
| 6030 | HU: Visualizar Perfil Personal | GET /usuarios/profile (duplicada) |
| 6031 | HU: Cambiar Contraseña Personal | PUT /usuarios/profile/password (duplicada) |
| 6259 | HU: Visualizar Perfil Personal | GET /usuarios/profile (duplicada) |
| 6260 | HU: Cambiar Contraseña Personal | PUT /usuarios/profile/password (duplicada) |
| 6493 | HU: Visualizar Perfil Personal | GET /usuarios/profile (duplicada) |
| 6495 | HU: Cambiar Contraseña Personal | PUT /usuarios/profile/password (duplicada) |

**APIs Necesarias:**
```typescript
GET    /api/usuarios/profile       // Obtener perfil del usuario actual
PUT    /api/usuarios/profile       // Actualizar perfil personal
PUT    /api/usuarios/profile/password  // Cambiar contraseña
GET    /api/usuarios/profile/permissions // Obtener permisos detallados
```

---

### 📊 **GRUPO 5: DASHBOARD Y ESTADÍSTICAS**

**Endpoint Base:** `/api/dashboard`

| HU ID | Título | Funcionalidad Core |
|-------|--------|-------------------|
| 6005 | HU: Visualizar Estadística General | GET /dashboard/stats |

**APIs Necesarias:**
```typescript
GET    /api/dashboard/counts       // Conteos generales (HU 6005 - Tareas BE)
GET    /api/dashboard/activity     // Actividad reciente (ya existe)
GET    /api/dashboard/stats        // Estadísticas de actividad (ya existe)
GET    /api/dashboard/trends       // Indicadores de tendencia
GET    /api/dashboard/charts       // Datos para gráficos
```

**Métricas Identificadas:**
- Total de Facultades
- Total de Carreras  
- Total de Usuarios Activos
- Distribución por roles
- Actividad reciente

---

## Duplicaciones Identificadas

### 🔴 **HUs Completamente Duplicadas (Mismo Título y Funcionalidad)**

| Funcionalidad | HUs Duplicadas | HU Principal Recomendada |
|---------------|----------------|-------------------------|
| Listar Facultades Registradas | 5094, 6015, 6241, 6477 | **5094** (más completa) |
| Registrar Nueva Facultad | 5100, 6019, 6261, 6483 | **5100** (más completa) |
| Listar Carreras Registradas | 5104, 6021, 6246, 6485 | **5104** (más completa) |
| Registrar Nueva Carrera | 5108, 6026, 6262, 6490 | **5108** (más completa) |
| Listar Usuarios Registrados | 5090, 6007, 6234, 6469, 5763 | **5090** (asignada a Victor) |
| Registrar Nuevo Usuario | 5102, 6009, 6233, 6470, 5764 | **5102** (más completa) |
| Visualizar Perfil Personal | 5116, 6030, 6259, 6493 | **5116** (más completa) |
| Cambiar Contraseña Personal | 5115, 6031, 6260, 6495 | **5115** (más completa) |
| Gestionar Facultades | 2313, 2407 | **2313** (creada primero) |
| Gestionar Carreras | 2438, 2410 | **2438** (más detallada) |

---

## Recomendaciones de Implementación

### 🏗️ **Fase 1: APIs Base (Fundación)**

1. **Implementar endpoints CRUD básicos para cada entidad:**
   - `/api/facultades` (completo)
   - `/api/carreras` (completo)  
   - `/api/usuarios` (completo)

### 🔍 **Fase 2: Filtros y Búsquedas**

2. **Agregar capacidades de filtrado avanzado:**
   - Búsqueda de texto libre
   - Filtros por relaciones (facultad, rol, estado)
   - Paginación estandarizada
   - Ordenamiento configurable

### 📊 **Fase 3: Dashboard y Analíticas**

3. **Implementar funcionalidades de dashboard:**
   - Conteos y métricas generales
   - Indicadores de tendencia
   - Actividad reciente (ya existe)

### 👤 **Fase 4: Funcionalidades de Usuario**

4. **Completar funcionalidades de perfil personal:**
   - Visualización de perfil
   - Cambio de contraseña
   - Gestión de permisos

### 🎯 **Optimización de Desarrollo**

**Una API bien diseñada puede satisfacer múltiples HUs:**

```typescript
// Un endpoint como este:
GET /api/facultades?search={query}&estado={estado}&page={page}&limit={limit}

// Satisface estas HUs:
// - 2780: listar facultades
// - 5094: Listar Facultades Registradas  
// - 5097: Filtrar Facultades
// - 6015, 6241, 6477: Duplicadas de listar
```

### 📋 **Consolidación Recomendada**

**En lugar de implementar 40+ HUs individuales, se pueden consolidar en:**

- **12 endpoints principales** que satisfacen toda la funcionalidad
- **Reutilización de componentes** frontend para listar/crear/editar
- **Patrones consistentes** de filtrado y paginación
- **APIs flexibles** que soporten múltiples casos de uso

---

## Conclusión

La agrupación por funcionalidad revela que muchas HUs son **variaciones del mismo endpoint** con diferentes filtros o presentaciones. Una implementación inteligente puede **satisfacer múltiples HUs con una sola API bien diseñada**, reduciendo significativamente el esfuerzo de desarrollo mientras mantiene toda la funcionalidad requerida.

**Próximo Paso Recomendado:** Implementar los endpoints base de cada grupo y luego iterar agregando filtros y funcionalidades específicas según las necesidades de cada HU.