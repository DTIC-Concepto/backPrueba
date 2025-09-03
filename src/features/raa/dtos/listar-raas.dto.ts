import { IsOptional, IsString, IsInt, IsBoolean, Min, Max, IsIn, IsDateString, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ListarRaasQueryDto {
  // Filtros básicos
  @ApiProperty({
    description: 'Filtrar por código del RAA',
    example: 'RAA-001',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El código debe ser una cadena de texto' })
  codigo?: string;

  @ApiProperty({
    description: 'Buscar en nombre y descripción del RAA',
    example: 'programación',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  busqueda?: string;

  @ApiProperty({
    description: 'Filtrar por ID de asignatura',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'El ID de asignatura debe ser un número entero' })
  @Min(1, { message: 'El ID de asignatura debe ser mayor a 0' })
  @Type(() => Number)
  asignaturaId?: number;

  @ApiProperty({
    description: 'Filtrar por ID de tipo de RAA',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'El ID de tipo RAA debe ser un número entero' })
  @Min(1, { message: 'El ID de tipo RAA debe ser mayor a 0' })
  @Type(() => Number)
  tipoRaaId?: number;

  @ApiProperty({
    description: 'Filtrar por estado activo del RAA',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  estadoActivo?: boolean;

  @ApiProperty({
    description: 'Filtrar por nivel del RAA',
    example: 'INTERMEDIO',
    enum: ['BASICO', 'INTERMEDIO', 'AVANZADO'],
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El nivel debe ser una cadena de texto' })
  @IsIn(['BASICO', 'INTERMEDIO', 'AVANZADO'], { 
    message: 'El nivel debe ser uno de: BASICO, INTERMEDIO, AVANZADO' 
  })
  nivel?: string;

  // Filtros avanzados
  @ApiProperty({
    description: 'Incluir RAAs eliminados (soft deleted)',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Incluir eliminados debe ser un valor booleano' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  incluirEliminados?: boolean;

  @ApiProperty({
    description: 'Filtrar por fecha de creación desde (ISO 8601)',
    example: '2025-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe estar en formato ISO 8601' })
  fechaCreacionDesde?: string;

  @ApiProperty({
    description: 'Filtrar por fecha de creación hasta (ISO 8601)',
    example: '2025-12-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe estar en formato ISO 8601' })
  fechaCreacionHasta?: string;

  // Paginación
  @ApiProperty({
    description: 'Número de página (comenzando desde 1)',
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'El número de página debe ser un entero' })
  @Min(1, { message: 'El número de página debe ser mayor a 0' })
  @Type(() => Number)
  pagina?: number;

  @ApiProperty({
    description: 'Cantidad de elementos por página',
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'El límite debe ser un entero' })
  @Min(1, { message: 'El límite debe ser mayor a 0' })
  @Max(100, { message: 'El límite no puede ser mayor a 100' })
  @Type(() => Number)
  limite?: number;

  // Ordenamiento
  @ApiProperty({
    description: 'Campo por el cual ordenar',
    example: 'codigo',
    enum: ['id', 'codigo', 'nombre', 'nivel', 'creadoEn', 'actualizadoEn'],
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El campo de ordenamiento debe ser una cadena' })
  @IsIn(['id', 'codigo', 'nombre', 'nivel', 'creadoEn', 'actualizadoEn'], {
    message: 'Campo de ordenamiento no válido',
  })
  ordenarPor?: 'id' | 'codigo' | 'nombre' | 'nivel' | 'creadoEn' | 'actualizadoEn';

  @ApiProperty({
    description: 'Dirección del ordenamiento',
    example: 'ASC',
    enum: ['ASC', 'DESC'],
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena' })
  @IsIn(['ASC', 'DESC'], { message: 'La dirección debe ser ASC o DESC' })
  direccion?: 'ASC' | 'DESC';
}

export class MetadatosPaginacionDto {
  @ApiProperty({
    description: 'Página actual',
    example: 1,
  })
  paginaActual: number;

  @ApiProperty({
    description: 'Elementos por página',
    example: 10,
  })
  limite: number;

  @ApiProperty({
    description: 'Total de elementos encontrados',
    example: 45,
  })
  totalElementos: number;

  @ApiProperty({
    description: 'Total de páginas disponibles',
    example: 5,
  })
  totalPaginas: number;

  @ApiProperty({
    description: 'Indica si hay página anterior',
    example: false,
  })
  tienePaginaAnterior: boolean;

  @ApiProperty({
    description: 'Indica si hay página siguiente',
    example: true,
  })
  tienePaginaSiguiente: boolean;

  @ApiProperty({
    description: 'Número de elementos en la página actual',
    example: 10,
  })
  elementosEnPagina: number;
}

export class FiltrosAplicadosDto {
  @ApiProperty({
    description: 'Códigos de filtros aplicados',
    example: ['estadoActivo', 'asignaturaId'],
  })
  filtrosActivos: string[];

  @ApiProperty({
    description: 'Valores de los filtros aplicados',
    example: { estadoActivo: true, asignaturaId: 1 },
  })
  valoresFiltros: Record<string, any>;

  @ApiProperty({
    description: 'Término de búsqueda aplicado',
    example: 'programación',
    required: false,
  })
  terminoBusqueda?: string;

  @ApiProperty({
    description: 'Criterio de ordenamiento aplicado',
    example: { campo: 'codigo', direccion: 'ASC' },
  })
  ordenamiento: {
    campo: string;
    direccion: string;
  };
}

export class ListarRaasResponseDto {
  @ApiProperty({
    description: 'Indica si la consulta fue exitosa',
    example: true,
  })
  exitoso: boolean;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'RAAs obtenidos exitosamente',
  })
  mensaje: string;

  @ApiProperty({
    description: 'Lista de RAAs encontrados',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        codigo: { type: 'string', example: 'RAA-001-001' },
        nombre: { type: 'string', example: 'Aplicación de principios de programación' },
        descripcion: { type: 'string', example: 'El estudiante será capaz de...' },
        asignaturaId: { type: 'number', example: 1 },
        tipoRaaId: { type: 'number', example: 1 },
        nivel: { type: 'number', example: 3 },
        estadoActivo: { type: 'boolean', example: true },
        creadoEn: { type: 'string', example: '2025-09-02T00:00:00.000Z' },
        actualizadoEn: { type: 'string', example: '2025-09-02T00:00:00.000Z' },
        eliminadoEn: { type: 'string', example: null },
      },
    },
  })
  datos: any[];

  @ApiProperty({
    description: 'Metadatos de paginación',
    type: MetadatosPaginacionDto,
  })
  paginacion: MetadatosPaginacionDto;

  @ApiProperty({
    description: 'Información sobre los filtros aplicados',
    type: FiltrosAplicadosDto,
  })
  filtros: FiltrosAplicadosDto;

  @ApiProperty({
    description: 'Tiempo de ejecución de la consulta en milisegundos',
    example: 45,
  })
  tiempoEjecucion: number;

  @ApiProperty({
    description: 'Información adicional sobre la consulta',
    example: {
      incluyeEliminados: false,
      consultaOptimizada: true,
    },
    required: false,
  })
  metadatos?: {
    incluyeEliminados: boolean;
    consultaOptimizada: boolean;
    advertencias?: string[];
  };
}
