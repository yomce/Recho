import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'instrument_category' })
export class InstrumentCategory {
  @PrimaryGeneratedColumn({
    name: 'instrument_category_id',
  })
  instrumentCategoryId: number;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'instrument_name',
  })
  instrumentName: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId: number | null;

  @ManyToOne(
    () => InstrumentCategory,
    (instrumentCategory) => instrumentCategory.children,
  )
  @JoinColumn({ name: 'parent_id' })
  parent: InstrumentCategory;

  @OneToMany(
    () => InstrumentCategory,
    (instrumentCategory) => instrumentCategory.parent,
  )
  children: InstrumentCategory[];
}
