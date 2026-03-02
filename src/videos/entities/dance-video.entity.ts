import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { CreatorProfile } from '../../creators/entities/creator-profile.entity';
import { Purchase } from '../../payments/entities/purchase.entity';

export enum VideoDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum VideoStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum VideoCategory {
  HIP_HOP = 'hip-hop',
  AFROBEATS = 'afrobeats',
  POP = 'pop',
  LATIN = 'latin',
  CONTEMPORARY = 'contemporary',
  BALLET = 'ballet',
  OTHER = 'other',
}

@Entity('dance_videos')
export class DanceVideo extends BaseEntity {
  @Column()
  creatorId: string;

  @ManyToOne(() => CreatorProfile, (creator) => creator.videos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'creatorId' })
  creator: CreatorProfile;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: VideoDifficulty, default: VideoDifficulty.BEGINNER })
  difficulty: VideoDifficulty;

  @Column({ type: 'enum', enum: VideoCategory, default: VideoCategory.OTHER })
  category: VideoCategory;

  @Column({ type: 'int', comment: 'Price in cents (USD)' })
  priceCents: number;

  @Column({ type: 'enum', enum: VideoStatus, default: VideoStatus.DRAFT })
  status: VideoStatus;

  @Column({ type: 'varchar', nullable: true })
  originalS3Key: string | null;

  @Column({ type: 'varchar', nullable: true })
  previewS3Key: string | null;

  @Column({ type: 'varchar', nullable: true })
  thumbnailS3Key: string | null;

  @Column({ type: 'int', nullable: true, comment: 'Duration in seconds (max 60)' })
  durationSeconds: number | null;

  @OneToMany(() => Purchase, (purchase) => purchase.video)
  purchases: Purchase[];
}
