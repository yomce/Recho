import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn()
  locationId: number;

  @Column()
  place_name: string;

  @Column()
  address: string;

  @Column('double precision')
  lat: number;

  @Column('double precision')
  lng: number;

  @Column()
  region_level1: string;

  @Column()
  region_level2: string;

  @Column()
  region_level3: string;
}
