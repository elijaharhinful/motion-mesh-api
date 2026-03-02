import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Purchase } from '../../payments/entities/purchase.entity';

export enum GenerationJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('generation_jobs')
export class GenerationJob extends BaseEntity {
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  purchaseId: string;

  @ManyToOne(() => Purchase, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseId' })
  purchase: Purchase;

  @Column({ type: 'varchar', nullable: true })
  klingTaskId: string | null;

  @Column({ comment: 'S3 key of the face photo uploaded by the user' })
  facePhotoS3Key: string;

  @Column({ type: 'varchar', nullable: true, comment: 'S3 key of the final generated video' })
  resultVideoS3Key: string | null;

  @Column({ type: 'varchar', nullable: true })
  resultVideoUrl: string | null;

  @Column({
    type: 'enum',
    enum: GenerationJobStatus,
    default: GenerationJobStatus.PENDING,
  })
  status: GenerationJobStatus;

  @Column({ type: 'text', nullable: true, comment: 'Error message if job failed' })
  errorMessage: string | null;
}
