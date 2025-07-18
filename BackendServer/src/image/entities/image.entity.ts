import { stringList } from 'aws-sdk/clients/datapipeline';
import { UsedProduct } from 'src/used_product/entities/used-product.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class Image {
  @PrimaryGeneratedColumn()
  imageId: number;

  @Column()
  imageUrl: string;

  /** 
   * 참조된 게시판의 DB 테이블 이름
  */
  @Column()
  refIn: string;

  /** 
   * 게시판 내 실제 데이터(primary key)의 ID
   * 이미지를 게시글보다 먼저 업로드 및 저장하기 때문에 nullable입니다
   * 게시글이 생성된 이후 해당 이미지에 postId가 매핑됩니다
  */
  @Column({ nullable: true, type: 'int' })
  refPostId: number | null;

  /**
   * 동일 refIn + refPostId 내에서 이미지 순서를 정의
   * 프론트에서 업로드 순서대로 지정 가능
   */
  @Column({ default: 0 })
  uploadOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'boolean', default: false })
  isThumbnail: boolean;
}