import {
    Column,
    CreateDateColumn, 
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

export interface Location {
    location_id: number;
    region_level_1: string;
    region_level_2: string;
}

@Entity({ name: 'practice_rooms' })
export class PracticeRoom {
    @PrimaryGeneratedColumn()
    postId: number;

    @Column()
    userId: number;

    @Column()
    title: string;

    @Column({ type: 'text' })
    description: string

    @CreateDateColumn()
    createdAt: Date;

    @Column({ type: 'jsonb' })
    location: Location;

    @Column({ default: 0 })
    viewCount: number;
}