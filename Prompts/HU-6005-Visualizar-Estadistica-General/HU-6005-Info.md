# Historia de Usuario 6005: Visualizar Estadística General

## Información General

- **ID**: 6005
- **Título**: HU: Visualizar Estadística General
- **Sprint**: sprint 6.1
- **Estado**: New
- **Story Points**: 2
- **Prioridad**: 2
- **Área de Valor**: Business

## Descripción de la Historia de Usuario

**Como** Administrador  
**Quiero** observar datos generales de la EPN  
**Para** conocer el estado actual de la EPN

## Criterios de Aceptación

### Escenario 1 – Acceder al Dashboard con estadísticas generales

**Dado que** estoy autenticado como Administrador en el sistema,  
**cuando** accedo a la opción "Dashboard" desde el menú lateral,  
**entonces** se carga y muestra la pantalla "Dashboard" con título principal **Y** se presenta una sección claramente identificada como "Estadísticas Generales", "Resumen de la EPN", o "Indicadores Institucionales" **Y** la sección contiene datos generales sobre el estado actual de la EPN **Y** puedo observar métricas numéricas clave de forma inmediata **Y** la información está organizada de manera visual y escaneable **Y** la opción "Dashboard" en el menú lateral se resalta indicando que es la sección activa.

### Escenario 2 – Visualizar estadísticas de total de facultades

**Dado que** estoy en la pantalla "Dashboard" **Y** existen facultades registradas en el sistema,  
**cuando** visualizo la sección de "Estadísticas Generales",  
**entonces** se muestra una tarjeta o indicador de métrica para "Total de Facultades" o "Facultades" **Y** la tarjeta presenta el número total de facultades registradas en formato grande y destacado (ej: número de 2-3 dígitos en tamaño 32-48px) **Y** la etiqueta descriptiva "Facultades" o "Total de Facultades" está debajo o al lado del número **Y** se incluye un icono representativo de facultades (ej: edificio, universidad, columnas griegas) **Y** el diseño de la tarjeta es consistente con el sistema (fondo blanco, bordes, sombra sutil) **Y** puedo conocer inmediatamente cuántas facultades tiene la EPN actualmente.

### Escenario 3 – Visualizar estadísticas de total de carreras

**Dado que** estoy en la pantalla "Dashboard" **Y** existen carreras registradas en el sistema,  
**cuando** visualizo la sección de "Estadísticas Generales",  
**entonces** se muestra una tarjeta o indicador de métrica para "Total de Carreras" o "Carreras" **Y** la tarjeta presenta el número total de carreras registradas en formato grande (ej: 25, 42, 67) **Y** la etiqueta "Carreras" o "Programas Académicos" identifica claramente la métrica **Y** se incluye un icono representativo (ej: diploma, birrete de graduación, certificado) **Y** puedo conocer el alcance de la oferta académica de la EPN **Y** el diseño visual es consistente con otras tarjetas de métricas.

### Escenario 4 – Visualizar estadísticas de total de usuarios o profesores

**Dado que** estoy en la pantalla "Dashboard" **Y** existen usuarios registrados en el sistema,  
**cuando** visualizo la sección de "Estadísticas Generales",  
**entonces** se muestra una tarjeta para "Total de Usuarios", "Profesores", o "Personal" **Y** la tarjeta presenta el número total de usuarios/profesores registrados (ej: 150, 320, 500) **Y** la etiqueta identifica claramente si son usuarios totales, solo profesores, o personal académico **Y** se incluye icono de persona o grupo de personas **Y** puedo conocer el tamaño del cuerpo docente o usuarios activos de la EPN **Y** la tarjeta sigue el mismo patrón visual de las demás.

### Escenario 5 – Visualizar múltiples métricas organizadas en cuadrícula

**Dado que** estoy en la pantalla "Dashboard" **Y** hay datos de múltiples categorías,  
**cuando** visualizo las "Estadísticas Generales",  
**entonces** las tarjetas de métricas están organizadas en una cuadrícula limpia (ej: 2 filas × 2 columnas, o 1 fila × 4 columnas) **Y** todas las tarjetas tienen el mismo tamaño y diseño para consistencia visual **Y** hay espaciado adecuado entre tarjetas (ej: 16-24px) **Y** las métricas están ordenadas lógicamente (ej: Facultades → Carreras → Profesores → Estudiantes) **Y** el diseño es responsive y se adapta a diferentes tamaños de pantalla **Y** puedo escanear todas las métricas rápidamente con una vista general **Y** obtengo una visión panorámica del estado actual de la EPN.

### Escenario 6 – Navegar a detalles haciendo clic en una métrica

**Dado que** estoy visualizando las "Estadísticas Generales" en el Dashboard **Y** veo la tarjeta "Total de Carreras" con el número actual,  
**cuando** hago clic en la tarjeta "Total de Carreras" o en el número/ícono,  
**entonces** soy redirigido directamente a la pantalla "Gestión de Carreras" (observada en imagen 10) **Y** puedo ver el listado completo de todas las carreras registradas **Y** la navegación me permite profundizar desde el resumen a los detalles **Y** puedo regresar al Dashboard usando el menú lateral o botón "atrás" del navegador **Y** la interactividad de las métricas facilita la navegación contextual desde estadísticas a gestión detallada.

### Escenario 7 – Visualizar Dashboard sin datos registrados en el sistema

**Dado que** estoy autenticado como Administrador **Y** el sistema es nuevo y NO tiene facultades, carreras ni usuarios registrados,  
**cuando** accedo a la pantalla "Dashboard",  
**entonces** se muestra la sección "Estadísticas Generales" **Y** las tarjetas de métricas muestran valores en cero: "0 Facultades", "0 Carreras", "0 Usuarios" **Y** opcionalmente se muestra un mensaje informativo como "No hay datos registrados aún. Comience agregando facultades y carreras." **Y** se pueden mostrar enlaces de acción rápida para "Crear Primera Facultad" o "Configurar Sistema" **Y** el mensaje es claro y orientador sin ser alarmante **Y** puedo conocer que el sistema está funcionando pero vacío.

### Escenario 8 – Actualizar estadísticas manualmente

**Dado que** estoy visualizando las "Estadísticas Generales" en el Dashboard **Y** han transcurrido varios minutos o he realizado cambios en otros módulos,  
**cuando** hago clic en un botón "Actualizar" o "Refrescar" (ícono de círculo con flechas) asociado a las estadísticas,  
**entonces** el sistema recalcula las métricas consultando la base de datos **Y** los números en las tarjetas se actualizan con los valores más recientes **Y** se muestra brevemente un indicador de carga (spinner) durante la actualización **Y** se actualiza el timestamp de "Última actualización" (ej: "Actualizado: 2025-10-02 15:30") **Y** las estadísticas reflejan el estado actual real de la EPN después de cualquier cambio reciente **Y** puedo asegurarme de que estoy viendo información actualizada.

### Escenario 9 – Visualizar indicadores de tendencia o cambios

**Dado que** estoy visualizando las "Estadísticas Generales" **Y** el sistema tiene datos históricos de periodos anteriores,  
**cuando** observo las tarjetas de métricas,  
**entonces** opcionalmente se muestran indicadores de tendencia junto a cada número **Y** por ejemplo: "42 Carreras ↑ +3 (7%)" indica que aumentaron 3 carreras respecto al periodo anterior **Y** o "15 Facultades → (0%)" indica que no hubo cambios **Y** flechas verdes hacia arriba indican crecimiento, flechas rojas hacia abajo indican disminución **Y** los porcentajes de cambio proporcionan contexto sobre la evolución **Y** puedo conocer no solo el estado actual sino también la dirección del cambio **Y** los indicadores me ayudan a monitorear crecimiento o contracción institucional.

### Escenario 10 – Visualizar gráficos complementarios de distribución

**Dado que** estoy en el Dashboard visualizando "Estadísticas Generales" **Y** hay suficientes datos para análisis,  
**cuando** scroll hacia abajo o reviso la sección completa de estadísticas,  
**entonces** opcionalmente se presentan visualizaciones gráficas complementarias **Y** por ejemplo: gráfico de barras mostrando "Carreras por Facultad" con número de carreras de cada facultad **Y** o gráfico de torta mostrando "Distribución de Usuarios por Rol" (% Profesores, % Coordinadores, % Administradores) **Y** o gráfico de líneas mostrando "Evolución de Estudiantes" en los últimos 6-12 meses **Y** cada gráfico tiene título descriptivo, leyenda clara, y etiquetas en ejes **Y** los colores son consistentes con el esquema del sistema **Y** las visualizaciones complementan las métricas numéricas proporcionando contexto adicional **Y** puedo obtener insights más profundos sobre el estado y distribución de datos de la EPN.

## Equipo de Trabajo

- **Creado por**: JOSE DAVID TERAN RAMOS (jose.teran@epn.edu.ec)
- **Modificado por**: DENIS ARIEL SUNTASIG QUINGA (denis.suntasig@epn.edu.ec)
- **Fecha de creación**: 2025-09-29T18:26:01.14Z
- **Última modificación**: 2025-10-03T01:26:30.867Z

## Tareas Relacionadas

### Backend (Implementación de API)

| ID | Título | Asignado | Estado |
|----|--------|----------|--------|
| 6048 | [BE] Crear endpoint GET /dashboard/counts | JOSE DAVID TERAN RAMOS | ✅ Closed |
| 6049 | [BE] Implementar lógica para obtener total de Facultades | JOSE DAVID TERAN RAMOS | 🟡 New |
| 6050 | [BE] Implementar lógica para obtener total de Carreras | JOSE DAVID TERAN RAMOS | 🟡 New |
| 6061 | [BE] Implementar lógica para obtener total de Usuarios Activos | JOSE DAVID TERAN RAMOS | 🟡 New |

### Frontend (Interfaz de Usuario)

| ID | Título | Asignado | Estado |
|----|--------|----------|--------|
| 6044 | [FE] Integrar API para obtener conteo de Facultades | VICTOR RAUL RODRIGUEZ ANDRADE | 🟡 Active |
| 6045 | [FE] Diseñar maquetar sección de contadores en Dashboard | VICTOR RAUL RODRIGUEZ ANDRADE | 🟡 Active |
| 6046 | [FE] Integrar API para obtener conteo de Carreras | VICTOR RAUL RODRIGUEZ ANDRADE | 🟡 Active |
| 6047 | [FE] Integrar API para obtener conteo de Usuarios Activos | VICTOR RAUL RODRIGUEZ ANDRADE | 🟡 Active |

## Enlaces Relevantes

- **Azure DevOps**: https://dev.azure.com/ProyectoTIC/b64345bc-babd-4084-bf08-dcdeafc4f37b/_workitems/edit/6005
- **Sprint**: ProyectoDTIC\\sprint 6.1