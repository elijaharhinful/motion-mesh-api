import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant';
import { GenerationJob } from './entities/generation-job.entity';
import { GenerationJobStatus } from './enums/generation-job-status.enum';
import { GenerationJobActions } from './actions/generation-job.actions';
import { TriggerGenerationDto } from './dto/trigger-generation.dto';
import { PurchaseActions } from '../payments/actions/purchase.actions';
import { StorageService } from '../storage/storage.service';
import { STORAGE_PREFIX } from '../storage/storage.constants';

export const AI_QUEUE = 'ai-generation';
export const PROCESS_GENERATION_JOB = 'process-generation';

@Injectable()
export class AiService {
  constructor(
    private readonly jobActions: GenerationJobActions,
    private readonly purchaseActions: PurchaseActions,
    @InjectQueue(AI_QUEUE)
    private readonly aiQueue: Queue,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Mints a presigned PUT URL so the browser can upload the buyer's face photo
   * directly to storage. The returned `key` is passed to triggerGeneration.
   */
  async getFacePhotoUploadUrl(
    userId: string,
    contentType: string,
  ): Promise<{ url: string; key: string }> {
    const bucket = this.configService.get<string>('S3_BUCKET') ?? '';
    const key = `${STORAGE_PREFIX.uploads}/${userId}/${Date.now()}`;
    const url = await this.storageService.getPresignedUploadUrl(
      bucket,
      key,
      contentType,
    );
    return { url, key };
  }

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

  /**
   * Returns a presigned GET URL for the owner to download their finished result
   * video. Throws until the job has completed and produced a stored result.
   */
  async getResultDownloadUrl(
    jobId: string,
    userId: string,
  ): Promise<{ url: string }> {
    const job = await this.getJobStatus(jobId, userId);
    if (!job.resultVideoS3Key) {
      throw new NotFoundException(ERROR_MESSAGES.GENERATION_RESULT_NOT_READY);
    }
    const bucket = this.configService.get<string>('S3_BUCKET') ?? '';
    const url = await this.storageService.getPresignedDownloadUrl(
      bucket,
      job.resultVideoS3Key,
    );
    return { url };
  }
}
