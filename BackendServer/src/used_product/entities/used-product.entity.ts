// src/entities/used-product.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Location } from 'src/map/entities/location.entity';
import { User } from 'src/auth/user/user.entity';

// 👇 STATUS Enum에 문자열 값을 할당합니다.
export enum STATUS {
  FOR_SALE = 'FOR_SALE',
  IN_PROGRESS = 'IN_PROGRESS',
  SOLD = 'SOLD',
}

// 👇 TRADE_TYPE Enum에 문자열 값을 할당합니다.
export enum TRADE_TYPE {
  IN_PERSON = 'IN_PERSON',
  DELIVERY = 'DELIVERY',
}

@Entity({ name: 'used_products' })
export class UsedProduct {
  @PrimaryGeneratedColumn()
  productId: number;

  @ManyToOne(() => User, (user: User) => user.userRooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user' })
  user: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  price: number;

  @Column()
  categoryId: number;

  @Column({
    type: 'enum',
    enum: STATUS,
    default: STATUS.FOR_SALE,
  })
  status: STATUS;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Location, { eager: true })
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @Column()
  locationId: number;

  @Column({
    type: 'enum',
    enum: TRADE_TYPE,
    default: TRADE_TYPE.IN_PERSON,
  })
  tradeType: TRADE_TYPE;

  @Column({ default: 0 })
  viewCount: number;
}
