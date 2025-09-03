import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, DeletedAt } from 'sequelize-typescript';

// Importaciones de modelos relacionados (ajustar según la estructura real)
// import { AsignaturaModel } from '../../asignatura/models/asignatura.model';
// import { TipoRaaModel } from '../../tipo-raa/models/tipo-raa.model';
// import { ResultadoRaaModel } from '../../resultado-raa/models/resultado-raa.model';

export interface RaaCreationAttributes {
  codigo?: string;
  nombre: string;
  descripcion: string;
  asignaturaId: number;
  tipoRaaId: number;
  nivel?: string | number;
  estadoActivo?: boolean;
}

@Table({
  tableName: 'raa',
  timestamps: true,
  paranoid: true, // Habilita soft deletes
})
export class RaaModel extends Model<RaaModel, RaaCreationAttributes> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: true, // Permitir null para generación automática
    unique: true,
  })
  declare codigo: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  declare nombre: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare descripcion: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 3,
    },
    get() {
      const value = this.getDataValue('nivel');
      // Mapear números a strings para compatibilidad
      switch (value) {
        case 1: return 'BASICO';
        case 2: return 'INTERMEDIO';
        case 3: return 'AVANZADO';
        default: return 'BASICO';
      }
    },
    set(value: string | number) {
      // Mapear strings a números para la base de datos
      if (typeof value === 'string') {
        switch (value.toUpperCase()) {
          case 'BASICO': this.setDataValue('nivel', 1); break;
          case 'INTERMEDIO': this.setDataValue('nivel', 2); break;
          case 'AVANZADO': this.setDataValue('nivel', 3); break;
          default: this.setDataValue('nivel', 1); break;
        }
      } else {
        this.setDataValue('nivel', value);
      }
    }
  })
  declare nivel: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare estadoActivo: boolean;

  // Relación con Asignatura
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare asignaturaId: number;

  // Relación con TipoRAA
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare tipoRaaId: number;

  @CreatedAt
  declare creadoEn: Date;

  @UpdatedAt
  declare actualizadoEn: Date;

  @DeletedAt
  declare eliminadoEn: Date;
}
