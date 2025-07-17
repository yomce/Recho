import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Video } from 'src/videos/entities/video.entity';

@Entity('search_video')
export class SearchVideoPreview {
  @PrimaryGeneratedColumn()
  id: number;

  /** 참조되는 게시판 테이블 이름 (ex: 'used_products') */
  @Column()
  refIn: string;

  /** 게시글의 실제 ID (예: used_products.id) */
  @Column({ nullable: true, type: 'int' })
  refPostId: number | null;

  /** 매핑된 비디오 */
  @ManyToOne(() => Video)
  @JoinColumn({ name: 'video_id' })
  video: Video;

  @CreateDateColumn()
  createdAt: Date;
}