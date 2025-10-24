import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
  PrimaryKey,
  AutoIncrement,
  HasMany,
  BelongsTo,
} from 'sequelize-typescript';
import { CarreraModel } from '../../carreras/models/carrera.model';
import { AsignaturaModel } from './asignatura.model';
import { RaaModel } from '../../raa/models/raa.model';

@Table({
  tableName: 'carrera_asignatura',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['carreraId', 'asignaturaId'],
      name: 'carrera_asignatura_unique',
    },
  ],
})
export class CarreraAsignaturaModel extends Model<CarreraAsignaturaModel> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => CarreraModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare carreraId: number;

  @ForeignKey(() => AsignaturaModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare asignaturaId: number;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Relaciones
  @BelongsTo(() => CarreraModel, {
    foreignKey: 'carreraId',
    as: 'carrera',
  })
  carrera: CarreraModel;

  @BelongsTo(() => AsignaturaModel, {
    foreignKey: 'asignaturaId',
    as: 'asignatura',
  })
  asignatura: AsignaturaModel;

  @HasMany(() => RaaModel, {
    foreignKey: 'carreraAsignaturaId',
    as: 'raas',
  })
  raas: RaaModel[];
}
