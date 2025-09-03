import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { RaaModel } from '../models/raa.model';
import { CreateRaaDto, UpdateRaaDto, FilterRaaDto } from '../dtos/raa.dto';
import { DeleteRaaDto, DeleteRaaResponseDto } from '../dtos/delete-raa.dto';
import { UpdateRaaRequestDto, UpdateRaaResponseDto } from '../dtos/update-raa.dto';
import { CreateRaaRequestDto } from '../dtos/create-raa-request.dto';
import { CreateRaaResponseDto } from '../dtos/create-raa-response.dto';
import { ListarRaasQueryDto, ListarRaasResponseDto, MetadatosPaginacionDto, FiltrosAplicadosDto } from '../dtos/listar-raas.dto';

@Injectable()
export class RaaService {
  constructor(
    @InjectModel(RaaModel)
    private readonly raaModel: typeof RaaModel,
  ) {}

  /**
   * Elimina un RAA por ID con diferentes estrategias según las relaciones existentes
   * @param deleteRaaDto - DTO con los parámetros de eliminación
   * @returns Respuesta con el resultado de la eliminación
   */
  async eliminarRaa(deleteRaaDto: DeleteRaaDto): Promise<DeleteRaaResponseDto> {
    const { id, confirmarEliminacion = false, forzarEliminacion = false } = deleteRaaDto;

    // Buscar el RAA por ID
    const raa = await this.raaModel.findByPk(id, {
      paranoid: false, // Incluir registros soft-deleted para verificar
    });

    if (!raa) {
      throw new NotFoundException(`RAA con ID ${id} no encontrado`);
    }

    // Verificar si ya está eliminado (soft delete)
    if (raa.eliminadoEn) {
      throw new BadRequestException(`El RAA con ID ${id} ya ha sido eliminado anteriormente`);
    }

    // Verificar si está inactivo
    if (!raa.estadoActivo) {
      throw new BadRequestException(`El RAA con ID ${id} ya está inactivo`);
    }

    // TODO: Verificar relaciones existentes con otras entidades
    // const relacionesExistentes = await this.verificarRelaciones(id);
    const relacionesExistentes = []; // Placeholder para implementación futura
    const advertencias: string[] = [];

    try {
      let tipoEliminacion: 'soft_delete' | 'hard_delete' | 'inactivated';
      
      if (relacionesExistentes.length > 0 && !forzarEliminacion) {
        // Si tiene relaciones y no se fuerza la eliminación, solo inactivar
        await this.raaModel.update(
          { estadoActivo: false },
          { where: { id } }
        );
        tipoEliminacion = 'inactivated';
        advertencias.push('El RAA fue inactivado debido a relaciones existentes');
        
        // TODO: definir reglas específicas en sprints futuros
        advertencias.push('TODO: Implementar validación específica de relaciones en sprints futuros');
      } else if (forzarEliminacion) {
        // Eliminación física (hard delete)
        await this.raaModel.destroy({ 
          where: { id },
          force: true // Eliminación física
        });
        tipoEliminacion = 'hard_delete';
        if (relacionesExistentes.length > 0) {
          advertencias.push('Se realizó eliminación física a pesar de tener relaciones existentes');
        }
      } else {
        // Eliminación suave (soft delete) - comportamiento por defecto
        await this.raaModel.destroy({ where: { id } });
        tipoEliminacion = 'soft_delete';
      }

      return {
        exitoso: true,
        mensaje: this.obtenerMensajeExito(tipoEliminacion),
        id: raa.id,
        codigo: raa.codigo,
        tipoEliminacion,
        advertencias: advertencias.length > 0 ? advertencias : undefined,
      };

    } catch (error) {
      throw new ConflictException(
        `Error al eliminar el RAA: ${error.message}`
      );
    }
  }

  /**
   * Buscar RAA por ID
   * @param id - ID del RAA
   * @returns RAA encontrado
   */
  async buscarPorId(id: number): Promise<RaaModel> {
    const raa = await this.raaModel.findByPk(id);
    if (!raa) {
      throw new NotFoundException(`RAA con ID ${id} no encontrado`);
    }
    return raa;
  }

  /**
   * Crear un nuevo RAA (método básico - compatible con implementación anterior)
   * @param createRaaDto - DTO con los datos del RAA
   * @returns RAA creado
   */
  async crear(createRaaDto: CreateRaaDto): Promise<RaaModel> {
    try {
      return await this.raaModel.create({
        codigo: createRaaDto.codigo,
        nombre: createRaaDto.codigo, // Usar código como nombre por compatibilidad
        descripcion: createRaaDto.descripcion,
        asignaturaId: createRaaDto.asignaturaId,
        tipoRaaId: createRaaDto.tipoRaaId,
        nivel: 'BASICO', // Valor por defecto
        estadoActivo: createRaaDto.estadoActivo ?? true,
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictException(`Ya existe un RAA con el código ${createRaaDto.codigo}`);
      }
      throw new BadRequestException(`Error al crear el RAA: ${error.message}`);
    }
  }

  /**
   * Actualizar un RAA existente
   * @param id - ID del RAA
   * @param updateRaaDto - DTO con los datos a actualizar
   * @returns Respuesta con el RAA actualizado y detalles de la operación
   */
  async actualizarConDetalle(id: number, updateRaaDto: UpdateRaaRequestDto): Promise<UpdateRaaResponseDto> {
    // Verificar que el RAA existe
    const raa = await this.buscarPorId(id);
    
    // Verificar que hay campos para actualizar
    const camposParaActualizar = Object.keys(updateRaaDto).filter(key => updateRaaDto[key] !== undefined);
    if (camposParaActualizar.length === 0) {
      throw new BadRequestException('No se proporcionaron campos para actualizar');
    }

    // Verificar unicidad del código si se está actualizando
    if (updateRaaDto.codigo && updateRaaDto.codigo !== raa.codigo) {
      const existeOtroConCodigo = await this.raaModel.findOne({
        where: { codigo: updateRaaDto.codigo },
      });
      
      if (existeOtroConCodigo) {
        throw new ConflictException(`Ya existe otro RAA con el código ${updateRaaDto.codigo}`);
      }
    }

    // Guardar valores anteriores para auditoría
    const valoresAnteriores: Record<string, any> = {};
    const camposModificados: string[] = [];

    for (const campo of camposParaActualizar) {
      if (raa[campo] !== updateRaaDto[campo]) {
        valoresAnteriores[campo] = raa[campo];
        camposModificados.push(campo);
      }
    }

    // Si no hay cambios reales, devolver el RAA sin modificar
    if (camposModificados.length === 0) {
      return {
        exitoso: true,
        mensaje: 'No se detectaron cambios en los datos del RAA',
        raa: raa.toJSON(),
        camposModificados: [],
      };
    }

    try {
      // Realizar la actualización
      await raa.update(updateRaaDto);
      
      // Recargar el RAA para obtener los datos actualizados
      await raa.reload();

      return {
        exitoso: true,
        mensaje: `RAA actualizado correctamente. ${camposModificados.length} campo(s) modificado(s)`,
        raa: raa.toJSON(),
        camposModificados,
        valoresAnteriores,
      };

    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictException(`Ya existe un RAA con el código ${updateRaaDto.codigo}`);
      }
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        throw new BadRequestException('Una o más referencias foráneas no son válidas');
      }
      throw new BadRequestException(`Error al actualizar el RAA: ${error.message}`);
    }
  }

  /**
   * Actualizar un RAA existente (método simplificado para compatibilidad)
   * @param id - ID del RAA
   * @param updateRaaDto - DTO con los datos a actualizar
   * @returns RAA actualizado
   */
  async actualizar(id: number, updateRaaDto: UpdateRaaDto): Promise<RaaModel> {
    const raa = await this.buscarPorId(id);
    
    try {
      await raa.update(updateRaaDto);
      return raa;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictException(`Ya existe un RAA con el código ${updateRaaDto.codigo}`);
      }
      throw new BadRequestException(`Error al actualizar el RAA: ${error.message}`);
    }
  }

  /**
   * Listar RAAs con filtros opcionales
   * @param filterRaaDto - DTO con filtros de búsqueda
   * @returns Lista de RAAs
   */
  async listar(filterRaaDto: FilterRaaDto = {}): Promise<RaaModel[]> {
    const whereClause: any = {};

    if (filterRaaDto.codigo) {
      whereClause.codigo = filterRaaDto.codigo;
    }
    if (filterRaaDto.asignaturaId) {
      whereClause.asignaturaId = filterRaaDto.asignaturaId;
    }
    if (filterRaaDto.tipoRaaId) {
      whereClause.tipoRaaId = filterRaaDto.tipoRaaId;
    }
    if (filterRaaDto.estadoActivo !== undefined) {
      whereClause.estadoActivo = filterRaaDto.estadoActivo;
    }

    return await this.raaModel.findAll({
      where: whereClause,
      order: [['codigo', 'ASC']],
    });
  }

  /**
   * Verificar si existe un RAA por código
   * @param codigo - Código del RAA
   * @returns True si existe, false si no
   */
  async existePorCodigo(codigo: string): Promise<boolean> {
    const count = await this.raaModel.count({ where: { codigo } });
    return count > 0;
  }

  /**
   * TODO: Verificar relaciones existentes del RAA con otras entidades
   * Esta función debe implementarse en sprints futuros cuando se definan
   * las reglas específicas de negocio para el manejo de relaciones
   * @param raaId - ID del RAA
   * @returns Array de relaciones existentes
   */
  private async verificarRelaciones(raaId: number): Promise<any[]> {
    // TODO: definir reglas específicas en sprints futuros
    // Ejemplo de implementación futura:
    // - Verificar relaciones con ResultadoRaa
    // - Verificar relaciones con otras entidades relevantes
    // - Retornar detalles de las relaciones encontradas
    
    return []; // Placeholder - retorna array vacío por ahora
  }

  /**
   * Obtener mensaje de éxito según el tipo de eliminación
   * @param tipoEliminacion - Tipo de eliminación realizada
   * @returns Mensaje descriptivo
   */
  private obtenerMensajeExito(tipoEliminacion: 'soft_delete' | 'hard_delete' | 'inactivated'): string {
    switch (tipoEliminacion) {
      case 'soft_delete':
        return 'RAA eliminado correctamente (eliminación suave)';
      case 'hard_delete':
        return 'RAA eliminado permanentemente de la base de datos';
      case 'inactivated':
        return 'RAA inactivado debido a relaciones existentes';
      default:
        return 'RAA procesado correctamente';
    }
  }

  /**
   * Registrar un nuevo RAA con funcionalidades avanzadas
   * @param createRaaRequestDto - DTO con los datos del nuevo RAA
   * @returns Respuesta detallada del registro
   */
  async registrarNuevoRaa(createRaaRequestDto: CreateRaaRequestDto): Promise<CreateRaaResponseDto> {
    try {
      // Validar que la asignatura existe (TODO: implementar cuando esté disponible el modelo)
      await this.validarAsignaturaExiste(createRaaRequestDto.asignaturaId);
      
      // Validar que el tipo RAA existe (TODO: implementar cuando esté disponible el modelo)
      await this.validarTipoRaaExiste(createRaaRequestDto.tipoRaaId);

      // Generar código si es necesario
      let codigoFinal = createRaaRequestDto.codigo;
      let codigoGenerado = false;
      
      if (!codigoFinal || createRaaRequestDto.generarCodigoAutomatico) {
        codigoFinal = await this.generarCodigoAutomatico(
          createRaaRequestDto.asignaturaId,
          createRaaRequestDto.prefijoPersonalizado || 'RAA'
        );
        codigoGenerado = true;
      }

      // Validar que el código no existe
      const existeCodigo = await this.existePorCodigo(codigoFinal);
      if (existeCodigo) {
        throw new ConflictException(`Ya existe un RAA con el código ${codigoFinal}`);
      }

      // Crear el RAA
      const nuevoRaa = await this.raaModel.create({
        codigo: codigoFinal,
        nombre: createRaaRequestDto.nombre,
        descripcion: createRaaRequestDto.descripcion,
        asignaturaId: createRaaRequestDto.asignaturaId,
        tipoRaaId: createRaaRequestDto.tipoRaaId,
        nivel: createRaaRequestDto.nivel || 'BASICO',
        estadoActivo: createRaaRequestDto.estadoActivo ?? true,
      });

      // Preparar respuesta detallada
      const response: CreateRaaResponseDto = {
        exitoso: true,
        mensaje: 'RAA registrado exitosamente',
        raa: {
          id: nuevoRaa.id,
          codigo: nuevoRaa.codigo,
          descripcion: nuevoRaa.descripcion,
          asignaturaId: nuevoRaa.asignaturaId,
          tipoRaaId: nuevoRaa.tipoRaaId,
          estadoActivo: nuevoRaa.estadoActivo,
          creadoEn: nuevoRaa.creadoEn,
          actualizadoEn: nuevoRaa.actualizadoEn,
        },
        detalles: {
          codigoGenerado,
          relacionesCreadas: ['asignatura', 'tipoRaa'],
        },
      };

      return response;

    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictException(`Ya existe un RAA con el código proporcionado`);
      }
      
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => err.message).join(', ');
        throw new BadRequestException(`Errores de validación: ${validationErrors}`);
      }

      throw new BadRequestException(`Error al registrar el RAA: ${error.message}`);
    }
  }

  /**
   * Generar código automático para un RAA
   * @param asignaturaId - ID de la asignatura
   * @param prefijo - Prefijo para el código
   * @returns Código único generado
   */
  private async generarCodigoAutomatico(asignaturaId: number, prefijo: string = 'RAA'): Promise<string> {
    // Obtener el siguiente número correlativo para la asignatura
    const ultimoRaa = await this.raaModel.findOne({
      where: { asignaturaId },
      order: [['id', 'DESC']],
      paranoid: false, // Incluir registros eliminados para evitar duplicados
    });

    let siguienteNumero = 1;
    if (ultimoRaa) {
      // Extraer número del último código si sigue el patrón
      const match = ultimoRaa.codigo.match(/(\d+)$/);
      if (match) {
        siguienteNumero = parseInt(match[1]) + 1;
      } else {
        // Si no sigue el patrón, contar todos los RAAs de la asignatura
        const count = await this.raaModel.count({
          where: { asignaturaId },
          paranoid: false,
        });
        siguienteNumero = count + 1;
      }
    }

    // Buscar un número disponible
    let codigoGenerado = '';
    let numeroIntento = siguienteNumero;
    let maxIntentos = 100; // Prevenir bucle infinito
    
    do {
      codigoGenerado = `${prefijo}-${asignaturaId.toString().padStart(3, '0')}-${numeroIntento.toString().padStart(3, '0')}`;
      const existe = await this.existePorCodigo(codigoGenerado);
      
      if (!existe) {
        break;
      }
      
      numeroIntento++;
      maxIntentos--;
    } while (maxIntentos > 0);

    if (maxIntentos === 0) {
      throw new BadRequestException('No se pudo generar un código único después de 100 intentos');
    }

    return codigoGenerado;
  }

  /**
   * Validar que la asignatura existe
   * TODO: Implementar cuando esté disponible el modelo de Asignatura
   * @param asignaturaId - ID de la asignatura
   */
  private async validarAsignaturaExiste(asignaturaId: number): Promise<void> {
    // TODO: Implementar validación real cuando esté disponible AsignaturaModel
    // const asignatura = await this.asignaturaModel.findByPk(asignaturaId);
    // if (!asignatura) {
    //   throw new NotFoundException(`Asignatura con ID ${asignaturaId} no encontrada`);
    // }
    
    // Por ahora, validación simple
    if (asignaturaId <= 0) {
      throw new BadRequestException('ID de asignatura inválido');
    }
  }

  /**
   * Validar que el tipo RAA existe
   * TODO: Implementar cuando esté disponible el modelo de TipoRaa
   * @param tipoRaaId - ID del tipo RAA
   */
  private async validarTipoRaaExiste(tipoRaaId: number): Promise<void> {
    // TODO: Implementar validación real cuando esté disponible TipoRaaModel
    // const tipoRaa = await this.tipoRaaModel.findByPk(tipoRaaId);
    // if (!tipoRaa) {
    //   throw new NotFoundException(`Tipo RAA con ID ${tipoRaaId} no encontrado`);
    // }
    
    // Por ahora, validación simple
    if (tipoRaaId <= 0) {
      throw new BadRequestException('ID de tipo RAA inválido');
    }
  }

  /**
   * Listar RAAs con funcionalidades avanzadas (paginación, filtros, búsqueda)
   * @param queryDto - DTO con parámetros de consulta
   * @returns Respuesta estructurada con RAAs y metadatos
   */
  async listarRaasAvanzado(queryDto: ListarRaasQueryDto): Promise<ListarRaasResponseDto> {
    const inicioTiempo = Date.now();

    try {
      // Configurar valores por defecto
      const pagina = queryDto.pagina || 1;
      const limite = queryDto.limite || 10;
      const offset = (pagina - 1) * limite;
      const ordenarPor = queryDto.ordenarPor || 'creadoEn';
      const direccion = queryDto.direccion || 'DESC';

      // Construir condiciones WHERE
      const whereConditions: any = {};
      const filtrosActivos: string[] = [];
      const valoresFiltros: Record<string, any> = {};

      // Filtro por código
      if (queryDto.codigo) {
        whereConditions.codigo = { [Op.iLike]: `%${queryDto.codigo}%` };
        filtrosActivos.push('codigo');
        valoresFiltros.codigo = queryDto.codigo;
      }

      // Filtro por asignatura
      if (queryDto.asignaturaId) {
        whereConditions.asignaturaId = queryDto.asignaturaId;
        filtrosActivos.push('asignaturaId');
        valoresFiltros.asignaturaId = queryDto.asignaturaId;
      }

      // Filtro por tipo RAA
      if (queryDto.tipoRaaId) {
        whereConditions.tipoRaaId = queryDto.tipoRaaId;
        filtrosActivos.push('tipoRaaId');
        valoresFiltros.tipoRaaId = queryDto.tipoRaaId;
      }

      // Filtro por estado activo
      if (queryDto.estadoActivo !== undefined) {
        whereConditions.estadoActivo = queryDto.estadoActivo;
        filtrosActivos.push('estadoActivo');
        valoresFiltros.estadoActivo = queryDto.estadoActivo;
      }

      // Filtro por nivel
      if (queryDto.nivel) {
        whereConditions.nivel = queryDto.nivel;
        filtrosActivos.push('nivel');
        valoresFiltros.nivel = queryDto.nivel;
      }

      // Filtro por búsqueda en nombre y descripción
      if (queryDto.busqueda) {
        whereConditions[Op.or] = [
          { nombre: { [Op.iLike]: `%${queryDto.busqueda}%` } },
          { descripcion: { [Op.iLike]: `%${queryDto.busqueda}%` } },
          { codigo: { [Op.iLike]: `%${queryDto.busqueda}%` } }
        ];
        filtrosActivos.push('busqueda');
        valoresFiltros.busqueda = queryDto.busqueda;
      }

      // Filtros por fechas
      if (queryDto.fechaCreacionDesde || queryDto.fechaCreacionHasta) {
        const fechaCondiciones: any = {};
        if (queryDto.fechaCreacionDesde) {
          fechaCondiciones[Op.gte] = new Date(queryDto.fechaCreacionDesde);
          filtrosActivos.push('fechaCreacionDesde');
          valoresFiltros.fechaCreacionDesde = queryDto.fechaCreacionDesde;
        }
        if (queryDto.fechaCreacionHasta) {
          fechaCondiciones[Op.lte] = new Date(queryDto.fechaCreacionHasta);
          filtrosActivos.push('fechaCreacionHasta');
          valoresFiltros.fechaCreacionHasta = queryDto.fechaCreacionHasta;
        }
        whereConditions.creadoEn = fechaCondiciones;
      }

      // Configurar opciones de consulta
      const queryOptions: any = {
        where: whereConditions,
        limit: limite,
        offset: offset,
        order: [[ordenarPor, direccion]],
        paranoid: !queryDto.incluirEliminados, // Controla soft deletes
      };

      // Ejecutar consulta con conteo
      const { count: totalElementos, rows: raas } = await this.raaModel.findAndCountAll(queryOptions);

      // Calcular metadatos de paginación
      const totalPaginas = Math.ceil(totalElementos / limite);
      const tienePaginaAnterior = pagina > 1;
      const tienePaginaSiguiente = pagina < totalPaginas;
      const elementosEnPagina = raas.length;

      // Construir metadatos
      const paginacion: MetadatosPaginacionDto = {
        paginaActual: pagina,
        limite,
        totalElementos,
        totalPaginas,
        tienePaginaAnterior,
        tienePaginaSiguiente,
        elementosEnPagina,
      };

      const filtros: FiltrosAplicadosDto = {
        filtrosActivos,
        valoresFiltros,
        terminoBusqueda: queryDto.busqueda,
        ordenamiento: {
          campo: ordenarPor,
          direccion,
        },
      };

      const tiempoEjecucion = Date.now() - inicioTiempo;

      // Construir respuesta
      const response: ListarRaasResponseDto = {
        exitoso: true,
        mensaje: this.construirMensajeListado(totalElementos, filtrosActivos.length),
        datos: raas.map(raa => raa.toJSON()),
        paginacion,
        filtros,
        tiempoEjecucion,
        metadatos: {
          incluyeEliminados: !!queryDto.incluirEliminados,
          consultaOptimizada: true,
          advertencias: this.generarAdvertencias(queryDto, totalElementos),
        },
      };

      return response;

    } catch (error) {
      throw new BadRequestException(`Error al listar RAAs: ${error.message}`);
    }
  }

  /**
   * Construir mensaje descriptivo del resultado del listado
   * @param totalElementos - Número total de elementos encontrados
   * @param numeroFiltros - Número de filtros aplicados
   * @returns Mensaje descriptivo
   */
  private construirMensajeListado(totalElementos: number, numeroFiltros: number): string {
    if (totalElementos === 0) {
      return numeroFiltros > 0 
        ? 'No se encontraron RAAs que cumplan con los criterios especificados'
        : 'No hay RAAs registrados en el sistema';
    }

    if (totalElementos === 1) {
      return numeroFiltros > 0 
        ? 'Se encontró 1 RAA que cumple con los criterios'
        : 'Se encontró 1 RAA en el sistema';
    }

    return numeroFiltros > 0 
      ? `Se encontraron ${totalElementos} RAAs que cumplen con los criterios`
      : `Se encontraron ${totalElementos} RAAs en el sistema`;
  }

  /**
   * Generar advertencias basadas en la consulta realizada
   * @param queryDto - Parámetros de consulta
   * @param totalElementos - Total de elementos encontrados
   * @returns Array de advertencias
   */
  private generarAdvertencias(queryDto: ListarRaasQueryDto, totalElementos: number): string[] {
    const advertencias: string[] = [];

    // Advertencia por incluir eliminados
    if (queryDto.incluirEliminados) {
      advertencias.push('La consulta incluye RAAs eliminados (soft delete)');
    }

    // Advertencia por resultados limitados
    if (totalElementos === 100 && (!queryDto.limite || queryDto.limite >= 100)) {
      advertencias.push('Se alcanzó el límite máximo de resultados. Use filtros para refinar la búsqueda');
    }

    // Advertencia por búsqueda muy amplia
    if (queryDto.busqueda && queryDto.busqueda.length < 3) {
      advertencias.push('Términos de búsqueda muy cortos pueden devolver muchos resultados');
    }

    // Advertencia por rango de fechas muy amplio
    if (queryDto.fechaCreacionDesde && queryDto.fechaCreacionHasta) {
      const fechaInicio = new Date(queryDto.fechaCreacionDesde);
      const fechaFin = new Date(queryDto.fechaCreacionHasta);
      const diferenciaDias = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diferenciaDias > 365) {
        advertencias.push('El rango de fechas especificado es muy amplio (>1 año)');
      }
    }

    return advertencias;
  }
}
