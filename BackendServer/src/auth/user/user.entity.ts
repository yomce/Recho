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
  @Column({ name: 'user_pw', type: 'varchar', length: 255 })
  @Exclude()
  password: string;

  /**
   * 프로필 사진 URL
   * @description VARCHAR(255), NULL
   */
  @Column({ name: 'user_profile_url', type: 'varchar', length: 255, nullable: true })
  profileUrl: string | null;

  /**
   * 생성일시
   * @description DATETIME, NOT NULL
   */
  @CreateDateColumn({ name: 'user_create_at', type: 'timestamp' })
  createdAt: Date;

  /**
   * 자기소개
   * @description VARCHAR(255), NULL
   */
  @Column({ name: 'user_intro', type: 'varchar', length: 255, nullable: true })
  intro: string | null;

  /**
   * 리프레시 토큰 (해시됨)
   * @description 리프레시 토큰을 해시하여 저장합니다. 로그아웃 시 NULL로 만들어 토큰을 무효화합니다.
   */
  @Column({ name: 'hashed_refresh_token', type: 'varchar', length: 255, nullable: true })
  @Exclude()
  hashedRefreshToken?: string | null;

  /** 이 사용자가 보낸 메시지들 (관계 정의) */
  @OneToMany(() => Message, (message) => message.sender)
  messages: Message[];

  /** 이 사용자가 참여한 방 목록 (관계 정의) */
  @OneToMany(() => UserRoom, (userRoom) => userRoom.user)
  userRooms: UserRoom[];
}
