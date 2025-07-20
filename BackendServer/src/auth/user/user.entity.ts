// src/user/entities/user.entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Message } from '../../chat/entities/message.entity';
import { UserRoom } from '../../chat/entities/user-room.entity';
import { RecruitEnsemble } from 'src/ensemble/entities/recruit-ensemble.entity';
import { NumberIdLike } from '../../likes/entities/number-id-like.entity';
import { Post } from '../../community/posts/entities/post.entity';
import { ApplierEnsemble } from 'src/application/entities/applier-ensemble.entity';
import { Video } from 'src/videos/entities';
import { UsedProduct } from 'src/used_product/entities/used-product.entity';
import { PracticeRoom } from 'src/practice_room/entities/practice-room.entity';

@Entity('Users')
export class User {
  /**
   * 아이디 (PK, 사용자가 직접 입력)
   * @description 사용자가 직접 지정하는 고유한 문자열 ID입니다.
   */
  @PrimaryColumn({
    type: 'varchar',
    length: 255,
    name: 'user_id',
  })
  id: string;

  /**
   * 닉네임
   * @description VARCHAR(50), NOT NULL
   */
  @Column({ name: 'user_name', type: 'varchar', length: 50 })
  username: string;

  /**
   * 이메일
   * @description VARCHAR(100), NOT NULL
   */
  @Column({ name: 'user_email', type: 'varchar', length: 100, unique: true })
  email: string;

  /**
   * 비밀번호 (해시됨)
   * @description VARCHAR(255), NOT NULL
   */
  @Exclude()
  @Column({ name: 'user_pw', type: 'varchar', length: 255, nullable: true })
  password: string;

  /**
   * 프로필 사진 URL
   * @description VARCHAR(255), NULL
   */
  @Column({
    name: 'user_profile_url',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  profileUrl: string | null;

  /**
   * 생성일시
   * @description DATETIME, NOT NULL
   */
  @Exclude()
  @CreateDateColumn({ name: 'user_create_at', type: 'timestamp' })
  createdAt: Date;

  /**
   * 자기소개
   * @description VARCHAR(255), NULL
   */
  @Column({ name: 'user_intro', type: 'varchar', length: 255, nullable: true })
  intro: string | null;

  // 소셜로그인 용
  @Exclude()
  @Column({ name: 'provider', type: 'varchar', length: 50, nullable: true })
  provider?: string; // 예: 'kakao', 'google', 'admin'

  @Exclude()
  @Column({ name: 'provider_id', type: 'varchar', length: 255, nullable: true })
  providerId?: string; // 소셜 로그인 플랫폼에서 제공하는 고유 ID

  /**
   * 리프레시 토큰 (해시됨)
   * @description 리프레시 토큰을 해시하여 저장합니다. 로그아웃 시 NULL로 만들어 토큰을 무효화합니다.
   */
  @Exclude()
  @Column({
    name: 'hashed_refresh_token',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @Exclude()
  hashedRefreshToken?: string | null;

  /** 이 사용자가 보낸 메시지들 (관계 정의) */
  @OneToMany(() => Message, (message) => message.sender)
  messages: Message[];

  /** 이 사용자가 참여한 방 목록 (관계 정의) */
  @OneToMany(() => UserRoom, (userRoom) => userRoom.user)
  userRooms: UserRoom[];

  @OneToMany(() => UsedProduct, (usedProduct) => usedProduct.user)
  usedProduct: UsedProduct[];
  
  @OneToMany(() => PracticeRoom, (practiceRoom) => practiceRoom.user)
  practiceRoom: PracticeRoom[];

  /** 이 사용자의 합주 포스터 */
  @OneToMany(() => RecruitEnsemble, (recruitEnsemble) => recruitEnsemble.user)
  recruitEnsemble: RecruitEnsemble[];

  @OneToMany(() => ApplierEnsemble, (applierEnsemble) => applierEnsemble.user)
  applierEnsemble: ApplierEnsemble[];

  @OneToMany(() => NumberIdLike, (like) => like.user)
  likes: NumberIdLike[];

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[]; // 👈 2. 이 코드를 추가하여 관계를 설정합니다.**

  @OneToMany(() => Video, (video) => video.user)
  videos: Video[];
}
