# Contexto del Sistema: Poliacredita

## Descripción General
Poliacredita es un sistema de gestión académica para la Escuela Politécnica Nacional que asegura la trazabilidad completa de la formación profesional y la alineación con los estándares de acreditación EUR-ACE. Permite mapear resultados de aprendizaje de carreras y asignaturas con criterios europeos y objetivos de perfil profesional, garantizando evidencia de cumplimiento.

## Entidades Principales

### Facultad
- **Atributos**: nombre, código, descripción, estadoActivo
- **Relaciones**: muchas Carreras y Usuarios

### Carrera
- **Atributos**: código, descripción
- **Relaciones**: 
  - Pertenece a una Facultad
  - Tiene: Coordinador (Usuario), Resultados de Aprendizaje, Asignaturas y OPPs

### Usuario
- **Atributos**: nombres, apellidos, cédula, correo, contraseña encriptada, rol, estadoActivo
- **Roles**: DGIP, PROFESOR, DECANO, SUBDECANO, JEFE_DEPARTAMENTO, COORDINADOR, CEI
- **Relaciones**: pertenece a Facultad, puede coordinar Carreras

### Asignatura
- **Atributos**: código, nombre, créditos, descripción, período académico
- **Relaciones**: 
  - Pertenece a TipoAsignatura y UnidadCurricular
  - Se relaciona con múltiples Carreras (many-to-many)

### TipoAsignatura
- **Descripción**: clasificación de asignaturas (obligatoria, electiva)

### UnidadCurricular
- **Descripción**: agrupación temática de asignaturas

### ResultadoAprendizaje (RA)
- **Atributos**: código auto-generado (CODIGO_CARRERA-CODIGO_RA), descripción, tipo (GENERAL/ESPECÍFICO)
- **Relaciones**: pertenece a Carrera, se relaciona con RAA, EURACE y OPP

### RAA (Resultado de Aprendizaje de Asignatura)
- **Atributos**: código, descripción
- **Relaciones**: Pertenece a una Asignatura y TipoRAA, se relaciona con RA

### EURACE
- **Atributos**: código, descripción
- **Relaciones**: many-to-many con RA (justificación)

### OPP (Objetivo de Perfil Profesional)
- **Atributos**: código auto-generado, descripción
- **Relaciones**: Pertenece a Carrera, se relaciona con RA (many-to-many)

### Relaciones (matrices de trazabilidad)
- **ResultadoRaa**: (RA ↔ RAA)
- **RaEurace**: (RA ↔ EURACE)
- **RaOpp**: (RA ↔ OPP)
- **CarreraAsignatura**: (Carrera ↔ Asignatura)

## Flujos de Negocio Principales
- Gestión de estructura académica (facultades, carreras, asignaturas, usuarios)
- Definición de competencias (RA generales/específicos)
- Trazabilidad curricular (RAA ↔ RA de carrera)
- Alineación con estándares (RA ↔ EURACE/OPP)
- Generación de matrices de verificación de acreditación

## Reglas Técnicas y Arquitectura

### Stack Tecnológico
- **Framework**: NestJS (TypeScript)
- **Base de Datos**: PostgreSQL
- **ORM**: Sequelize (@nestjs/sequelize)

### Conexión Global (app.module.ts)
```typescript
SequelizeModule.forRoot({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  autoLoadModels: true,
  synchronize: true,
})
```

### Módulos por Feature

Cada HU = un único módulo con carpeta `src/features/<feature-kebab>/`

#### Estructura Interna:
- `<feature>.module.ts`
- `controllers/<feature>.controller.ts`
- `services/<feature>.service.ts`
- `models/<entity>.model.ts` (con @Table, @Column, @ForeignKey, @BelongsTo, etc.)
- `dtos/CreateXxxDto.ts`, `UpdateXxxDto.ts`, `FilterXxxDto.ts`
- `index.ts` (barrel file)

### Convenciones

- **Carpeta**: kebab-case
- **Modelos Sequelize**: PascalCase + sufijo Model (ej: `ResultadoAprendizajeModel`)
- **DTOs**: `CreateXxxDto`, `UpdateXxxDto`, `FilterXxxDto`
- Un solo controller y un solo service por feature (no crear uno por cada tarea)
- Endpoints REST en controller ↔ métodos en service ↔ modelos/DTOs

## Características Importantes

- Códigos auto-generados en RA y OPP
- Validaciones de negocio en entidades y relaciones
- Soft deletes en Asignaturas
- Índices únicos en tablas many-to-many
- Contraseñas encriptadas automáticamente
- Timestamps automáticos para auditoría

## Guía de Uso

Cuando se entregue una HU con tareas [BE]:

1. Generar un único módulo con la estructura descrita
2. Mapear cada tarea [BE] a un endpoint REST y un método en el service
3. Crear/ajustar modelos Sequelize necesarios (y relaciones)
4. Crear/ajustar DTOs con validaciones
5. Entregar: árbol de archivos del feature, controller con endpoints, service con firmas, modelos y DTOs

## Restricciones

- **NO** crear múltiples módulos/servicios por cada tarea
- Persistencia obligatoria en PostgreSQL usando Sequelize
- Si algo no es claro, generar la versión mínima viable y documentar con TODO