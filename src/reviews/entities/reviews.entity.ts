import { IsInt, Max, MAX, Min } from "class-validator";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ManyToOne,JoinColumn } from "typeorm";
import { TripsEntity } from "src/matching/entities/trips.entity";
import { Users } from "src/auth/entities/users.entity";


@Entity()
export class ReviewsEntity {
    @PrimaryGeneratedColumn()
    id: number;

    // Trips와 관계 설정
    @ManyToOne(() => TripsEntity, (trip) => trip.reviews, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'match_id' }) // 외래 키 이름
    match: TripsEntity;

    // Reviewer (승객)와 관계 설정
    @ManyToOne(() => Users, (user) => user.reviewsWritten, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'reviewer_id' }) // 외래 키 이름
    reviewer: Users;

    // Target (운전자)와 관계 설정
    @ManyToOne(() => Users, (user) => user.reviewsReceived, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'target_id' }) // 외래 키 이름
    target: Users;

    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @CreateDateColumn()
    created_at: Date;
}

