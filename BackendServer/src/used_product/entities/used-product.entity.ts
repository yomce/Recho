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
  FOR_SALE,
  IN_PROGRESS,
  SOLD,
}

// 👇 TRADE_TYPE Enum에 문자열 값을 할당합니다.
export enum TRADE_TYPE {
  IN_PERSON,
  DELIVERY,
}

@Entity({ name: 'used_products' })
export class UsedProduct {
  @PrimaryGeneratedColumn({
    name: 'product_id',
  })
  productId: number;

  @ManyToOne(() => User, (user) => user.usedProduct, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user' })
  user: User;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'title',
  })
  title: string;

  @Column({
    type: 'text',
    name: 'description',
  })
  description: string;

  @Column({
    type: 'int',
    name: 'price',
  })
  price: number;

  @Column({
    type: 'int',
    name: 'category_id',
  })
  categoryId: number;

  @Column({
    type: 'enum',
    enum: STATUS,
    name: 'status',
    default: STATUS.FOR_SALE,
  })
  status: STATUS;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
  })
  createdAt: Date;

  @ManyToOne(() => Location, { eager: true })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column()
  locationId: number;

  @Column({
    type: 'enum',
    enum: TRADE_TYPE,
    name: 'trade_type',
    default: TRADE_TYPE.IN_PERSON,
  })
  tradeType: TRADE_TYPE;

  @Column({
    type: 'int',
    name: 'view_count',
    default: 0,
  })
  viewCount: number;
}
