// src/entities/used-product.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

// 👇 STATUS Enum에 문자열 값을 할당합니다.
export enum STATUS {
  FOR_SALE,
  IN_PROGRESS,
  SOLD,
}

// 👇 TRADE_TYPE Enum에 문자열 값을 할당합니다.
export enum TRADE_TYPE {
  IN_PERSON,
  DELIVERY,
}

export interface Location {
  location_id: number;
  region_level_1: string;
  region_level_2: string;
}

@Entity({ name: 'used_products' })
export class UsedProduct {
  @PrimaryGeneratedColumn()
  productId: number;

  @Column()
  userId: string;

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

  @Column({ type: 'jsonb' })
  location: Location;

  @Column({
    type: 'enum',
    enum: TRADE_TYPE,
    default: TRADE_TYPE.IN_PERSON,
  })
  tradeType: TRADE_TYPE;

  @Column({ default: 0 })
  viewCount: number;
}
