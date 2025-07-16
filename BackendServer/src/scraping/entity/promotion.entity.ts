import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid', { name: 'promotion_id' })
  promotionId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subtitle: string;

  @Column({ name: 'image_url', type: 'text' })
  imageUrl: string;
}
