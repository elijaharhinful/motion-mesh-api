import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant';
import { GenerationJob } from './entities/generation-job.entity';
import { GenerationJobStatus } from './enums/generation-job-status.enum';
import { GenerationJobActions } from './actions/generation-job.actions';
import { TriggerGenerationDto } from './dto/trigger-generation.dto';
import { PurchaseActions } from '../payments/actions/purchase.actions';

export const AI_QUEUE = 'ai-generation';
export const PROCESS_GENERATION_JOB = 'process-generation';

@Injectable()
export class AiService {
  constructor(
    private readonly jobActions: GenerationJobActions,
    private readonly purchaseActions: PurchaseActions,
    @InjectQueue(AI_QUEUE)
    private readonly aiQueue: Queue,
  ) {}

  async triggerGeneration(
    userId: string,
    dto: TriggerGenerationDto,
  ): Promise<GenerationJob> {
    const purchase = await this.purchaseActions.findSucceededByIdForUser(
      dto.purchaseId,
      userId,
    );
    if (!purchase) {
      throw new NotFoundException(ERROR_MESSAGES.PURCHASE_NOT_FOUND);
    }

    const job = this.jobActions.create({
      userId,
      purchaseId: dto.purchaseId,
      facePhotoS3Key: dto.facePhotoS3Key,
      status: GenerationJobStatus.PENDING,
    });
    const saved = await this.jobActions.save(job);

    await this.aiQueue.add(PROCESS_GENERATION_JOB, { jobId: saved.id });

    return saved;
  }

  async getJobStatus(jobId: string, userId: string): Promise<GenerationJob> {
    const job = await this.jobActions.findByIdWithPurchase(jobId);
    if (!job)
      throw new NotFoundException(ERROR_MESSAGES.GENERATION_JOB_NOT_FOUND);
    if (job.userId !== userId) {
      throw new ForbiddenException(ERROR_MESSAGES.GENERATION_JOB_FORBIDDEN);
    }
    return job;
  }
}
