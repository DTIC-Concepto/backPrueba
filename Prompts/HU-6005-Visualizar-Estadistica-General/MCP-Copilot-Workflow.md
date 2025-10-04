# Flujo de Trabajo: Azure DevOps MCP + GitHub Copilot

## Descripción del Proceso

Este documento describe el flujo de trabajo para conectar **Azure DevOps** con **GitHub Copilot** utilizando **Model Context Protocol (MCP)** para implementar código basado en Historias de Usuario.

## Configuración Inicial

### 1. Configuración MCP en VS Code

```json
// .vscode/mcp.json
{
  "inputs": [
    {
      "id": "ado_org",
      "type": "promptString",
      "description": "Azure DevOps organization name  (e.g. 'contoso')"
    }
  ],
  "servers": {
    "ado": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@azure-devops/mcp", "${input:ado_org}"]
    }
  }
}
```

### 2. Configuración Copilot Instructions

```markdown
// .github/copilot-instructions.md
# Context

Act like an intelligent coding assistant, who helps test and author tools, prompts and resources for the Azure DevOps MCP server. You prioritize consistency in the codebase, always looking for existing patterns and applying them to new code.

If the user clearly intends to use a tool, do it.
If the user wants to author a new one, help them.

## Using MCP tools

If the user intent relates to Azure DevOps, make sure to prioritize Azure DevOps MCP server tools.

## Adding new tools

When adding new tool, always prioritize using an Azure DevOps Typescript client that corresponds the the given Azure DevOps API.
Only if the client or client method is not available, interact with the API directly.
The tools are located in the `src/tools.ts` file.

## Adding new prompts

Ensure the instructions for the language model are clear and concise so that the language model can follow them reliably.
The prompts are located in the `src/prompts.ts` file.
```

## Flujo de Trabajo Paso a Paso

### Paso 1: Consulta de Historia de Usuario desde Azure DevOps

```bash
# El usuario solicita implementar una HU específica
Usuario: "Ahora puedes tomar la HU 6005 junto con todas las tareas que tengan como descripcion '[BE]' que se refiere a backend e implementar sobre el codigo actual?"
```

### Paso 2: Copilot utiliza MCP para consultar Azure DevOps

```typescript
// Copilot ejecuta automáticamente estos comandos MCP:

// 1. Obtener información de la Historia de Usuario
mcp_ado_wit_get_work_item({
  project: "ProyectoDTIC",
  expand: "all",
  id: 6005
})

// 2. Obtener todas las tareas relacionadas
mcp_ado_wit_get_work_items_batch_by_ids({
  ids: [6061, 6045, 6049, 6047, 6050, 6046, 6044, 6048],
  project: "ProyectoDTIC"
})

// 3. Filtrar tareas de backend ([BE])
// Identifica: 6048 (cerrada), 6049, 6050, 6061
```

### Paso 3: Análisis del Código Existente

```typescript
// Copilot analiza la estructura del proyecto
read_file({
  filePath: "/src/app.module.ts",
  startLine: 1,
  endLine: 50
})

read_file({
  filePath: "/src/dashboard/dashboard.controller.ts",
  startLine: 1,
  endLine: 100
})

// Identifica patrones existentes: NestJS, Sequelize, estructura modular
```

### Paso 4: Planificación de Implementación

```typescript
// Copilot crea un plan estructurado
manage_todo_list({
  operation: "write",
  todoList: [
    {
      id: 1,
      title: "Revisar HU 6005 y tareas BE",
      description: "Obtener detalles de la Historia de Usuario 6005 y identificar todas las tareas de backend ([BE]) relacionadas",
      status: "in-progress"
    },
    {
      id: 2,
      title: "Analizar estructura del proyecto",
      description: "Revisar la estructura actual del código backend para entender la arquitectura y patrones existentes",
      status: "not-started"
    }
    // ... más tareas
  ]
})
```

### Paso 5: Implementación del Código

```typescript
// Copilot implementa siguiendo los patrones existentes del proyecto

// 1. Crear DTOs
create_file({
  filePath: "/src/dashboard/dto/dashboard-counts.dto.ts",
  content: `// DTO siguiendo patrones del proyecto`
})

// 2. Actualizar Service
replace_string_in_file({
  filePath: "/src/dashboard/dashboard.service.ts",
  oldString: "// código existente",
  newString: "// código actualizado con nueva funcionalidad"
})

// 3. Actualizar Controller
replace_string_in_file({
  filePath: "/src/dashboard/dashboard.controller.ts",
  oldString: "// código existente",
  newString: "// código actualizado con nuevo endpoint"
})
```

### Paso 6: Actualización de Estado en Azure DevOps

```typescript
// Copilot actualiza automáticamente las tareas completadas
mcp_ado_wit_update_work_item({
  updates: [{
    op: "replace",
    path: "/fields/System.State",
    value: "Closed"
  }],
  id: 6049 // ID de la tarea completada
})
```

## Template de Prompt para Implementación

### Prompt Utilizado por Copilot

```markdown
# Implementación de Historia de Usuario desde Azure DevOps

## Contexto
- **HU ID**: {hu_id}
- **Título**: {hu_title}
- **Descripción**: {hu_description}
- **Criterios de Aceptación**: {acceptance_criteria}

## Tareas de Backend Identificadas
{backend_tasks_list}

## Arquitectura del Proyecto
- **Framework**: NestJS
- **ORM**: Sequelize
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT
- **Documentación**: Swagger/OpenAPI

## Patrones a Seguir
1. **Controladores**: Usar decoradores de Swagger para documentación
2. **Servicios**: Inyección de dependencias con @Injectable()
3. **DTOs**: Validación con class-validator
4. **Modelos**: Sequelize con TypeScript decorators
5. **Estructura**: Modular por dominio

## Implementación Requerida
{implementation_requirements}

## Criterios de Completitud
- [ ] Endpoint implementado siguiendo patrones del proyecto
- [ ] Documentación Swagger actualizada
- [ ] DTOs de request/response creados
- [ ] Lógica de negocio en el service
- [ ] Validaciones apropiadas
- [ ] Manejo de errores consistente
- [ ] Tareas de Azure DevOps actualizadas
```

## Beneficios del Flujo MCP + Copilot

### 1. **Trazabilidad Completa**
- Conexión directa entre código y requerimientos en Azure DevOps
- Actualización automática del estado de las tareas
- Historial completo de implementación

### 2. **Consistencia en el Código**
- Análisis automático de patrones existentes
- Implementación siguiendo convenciones del proyecto
- Reutilización de componentes y estructuras

### 3. **Eficiencia en el Desarrollo**
- Reducción de tiempo en consulta manual de Azure DevOps
- Implementación guiada por criterios de aceptación
- Automatización de tareas administrativas

### 4. **Calidad del Código**
- Implementación basada en requerimientos específicos
- Documentación automática con Swagger
- Validaciones y manejo de errores consistentes

## Comandos MCP Más Utilizados

```typescript
// Gestión de Work Items
mcp_ado_wit_get_work_item()
mcp_ado_wit_get_work_items_batch_by_ids()
mcp_ado_wit_update_work_item()

// Consulta de Proyectos y Equipos
mcp_ado_core_list_projects()
mcp_ado_core_list_project_teams()

// Gestión de Sprints
mcp_ado_work_list_team_iterations()

// Búsqueda
mcp_ado_search_workitem()
```

## Resultados Esperados

Al final del flujo, se obtiene:

1. **Código Implementado** siguiendo las especificaciones de la HU
2. **Documentación Actualizada** con la nueva funcionalidad
3. **Tareas de Azure DevOps** marcadas como completadas
4. **Trazabilidad Completa** entre requerimiento y implementación
5. **Consistencia** con el resto del proyecto

Este flujo permite una integración seamless entre la gestión de proyectos en Azure DevOps y el desarrollo de código con GitHub Copilot, maximizando la eficiencia y calidad del desarrollo.