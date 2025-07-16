import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('promotions') // 'promotions' 라는 이름의 테이블과 매핑
export class Promotion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subtitle: string;

  @Column({ name: 'image_url', type: 'text' }) // DB 컬럼명은 image_url로 지정
  imageUrl: string;
}
