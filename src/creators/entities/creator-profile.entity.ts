import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { DanceVideo } from '../../videos/entities/dance-video.entity';

@Entity('creator_profiles')
export class CreatorProfile extends BaseEntity {
  @Column()
  userId: string;

  @OneToOne(() => User, (user) => user.creatorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', nullable: true })
  stripeConnectAccountId: string | null;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'varchar', nullable: true })
  socialLink: string | null;

  @OneToMany(() => DanceVideo, (video) => video.creator)
  videos: DanceVideo[];
}
