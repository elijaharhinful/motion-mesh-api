import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { DanceVideo } from '../../videos/entities/dance-video.entity';

export enum PurchaseStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('purchases')
export class Purchase extends BaseEntity {
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  videoId: string;

  @ManyToOne(() => DanceVideo, (video) => video.purchases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'videoId' })
  video: DanceVideo;

  @Column({ unique: true })
  stripePaymentIntentId: string;

  @Column({ type: 'int', comment: 'Total amount paid in cents' })
  amountCents: number;

  @Column({ type: 'int', comment: '30% platform fee in cents' })
  platformFeeCents: number;

  @Column({ type: 'int', comment: '70% creator payout in cents' })
  creatorPayoutCents: number;

  @Column({ type: 'enum', enum: PurchaseStatus, default: PurchaseStatus.PENDING })
  status: PurchaseStatus;
}
