import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Repository } from 'typeorm';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constant';
import { GenerationJob, GenerationJobStatus } from './entities/generation-job.entity';
import { TriggerGenerationDto } from './dto/trigger-generation.dto';
import { Purchase, PurchaseStatus } from '../payments/entities/purchase.entity';

export const AI_QUEUE = 'ai-generation';
export const PROCESS_GENERATION_JOB = 'process-generation';

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(GenerationJob)
    private readonly jobsRepository: Repository<GenerationJob>,
    @InjectRepository(Purchase)
    private readonly purchasesRepository: Repository<Purchase>,
    @InjectQueue(AI_QUEUE)
    private readonly aiQueue: Queue,
  ) {}

  async triggerGeneration(
    userId: string,
    dto: TriggerGenerationDto,
  ): Promise<GenerationJob> {
    const purchase = await this.purchasesRepository.findOne({
      where: { id: dto.purchaseId, userId, status: PurchaseStatus.SUCCEEDED },
    });
    if (!purchase) {
      throw new NotFoundException(ERROR_MESSAGES.PURCHASE_NOT_FOUND);
    }

    const job = this.jobsRepository.create({
      userId,
      purchaseId: dto.purchaseId,
      facePhotoS3Key: dto.facePhotoS3Key,
      status: GenerationJobStatus.PENDING,
    });
    const saved = await this.jobsRepository.save(job);

    await this.aiQueue.add(PROCESS_GENERATION_JOB, { jobId: saved.id });

    return saved;
  }

  async getJobStatus(jobId: string, userId: string): Promise<GenerationJob> {
    const job = await this.jobsRepository.findOne({
      where: { id: jobId },
      relations: ['purchase'],
    });
    if (!job) throw new NotFoundException(ERROR_MESSAGES.GENERATION_JOB_NOT_FOUND);
    if (job.userId !== userId) {
      throw new ForbiddenException(ERROR_MESSAGES.GENERATION_JOB_FORBIDDEN);
    }
    return job;
  }
}
