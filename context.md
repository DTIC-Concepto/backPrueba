# Contexto del Sistema: Poliacredita

## Descripción General
El sello EUR-ACE es una etiqueta de calidad europea que certifica que un programa de estudios de ingeniería cumple con estándares de excelencia y los requisitos profesionales del ámbito europeo. Otorga una garantía internacional de la formación de un ingeniero y facilita la movilidad académica y profesional al reconocer las competencias adquiridas.
Los objetivos del sistema de acreditación EUR-ACE son certificar la calidad de las carreras de ingeniería en Europa y el mundo, garantizando que cumplen estándares internacionales y asegurando que los titulados poseen conocimientos, habilidades técnicas y competencias profesionales para la empleabilidad. Además, busca facilitar la movilidad académica y profesional de estudiantes y docentes, fortalecer alianzas globales y mejorar la transparencia y el reconocimiento de las titulaciones en el ámbito internacional.
La Escuela Politécnica Nacional EPN es una universidad pública, de grado y posgrado, ubicada en Quito, Ecuador. Reconocida por la investigación y la educación en ciencias básicas, ingenierías y tecnología, ofrece programas doctorales, de maestría y de grado.
La Escuela Politécnica Nacional consta de 9 facultades que albergan 6 carreras de tecnología superior, 24 carreras de pregrado, 22 maestrías y 6 doctorados en postgrado. Dichas especialidades pertenecen al campo del conocimiento de las ciencias, ingeniería y formación tecnológica.
Las carreras de grado, carreras de tecnología superior y carreras de pregrado se conocen como “carreras”. Para EUR-ACE son carreras de ingeniería. EUR-ACE certifica programas de estudios de ingeniería o “carreras de ingeniería” para el caso de Ecuador.
Cada carrera tiene una malla curricular donde están todas las asignaturas que los estudiantes deben cursar. Cada asignatura tiene su resultados de aprendizaje de la asignatura RAA. Cada carrera tiene resultados de aprendizaje de la carrera RA.
En una matriz RA-RAA se relacionan los RAA con los RA. En otra matriz EURACE-RA se relacionan los RA con los objetivos EUR-ACE. Con las matrices anteriores podemos definir como las asignaturas ayudan a cumplir los objetivos EUR-ACE.

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
- **Atributos**: código, descripción, tipo (GENERAL/ESPECÍFICO)
- **Relaciones**: pertenece a Carrera, se relaciona con RAA, EURACE y OPP

### RAA (Resultado de Aprendizaje de Asignatura)
- **Atributos**: código, descripción
- **Relaciones**: Pertenece a una Asignatura y TipoRAA, se relaciona con RA

### EURACE
- **Atributos**: código, descripción
- **Relaciones**: many-to-many con RA (justificación)

### OPP (Objetivo de Perfil Profesional)
- **Atributos**: código, descripción
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




## Características Importantes
- Validaciones de negocio en entidades y relaciones
- Soft deletes en Asignaturas
- Índices únicos en tablas many-to-many
- Contraseñas encriptadas automáticamente
- Timestamps automáticos para auditoría




