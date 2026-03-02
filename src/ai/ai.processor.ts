import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GenerationJob, GenerationJobStatus } from './entities/generation-job.entity';
import { KlingAiClient } from './kling-ai.client';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AI_QUEUE, PROCESS_GENERATION_JOB } from './ai.service';

const POLL_INTERVAL_MS = 10_000;
const MAX_POLL_ATTEMPTS = 60;

@Processor(AI_QUEUE)
export class AiProcessor {
  private readonly logger = new Logger(AiProcessor.name);

  constructor(
    @InjectRepository(GenerationJob)
    private readonly jobsRepository: Repository<GenerationJob>,
    private readonly klingClient: KlingAiClient,
    private readonly storageService: StorageService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  @Process(PROCESS_GENERATION_JOB)
  async handleGeneration(bullJob: Job<{ jobId: string }>): Promise<void> {
    const job = await this.jobsRepository.findOne({
      where: { id: bullJob.data.jobId },
      relations: ['user', 'purchase', 'purchase.video'],
    });

    if (!job) {
      this.logger.error(`Job not found: ${bullJob.data.jobId}`);
      return;
    }

    try {
      job.status = GenerationJobStatus.PROCESSING;
      await this.jobsRepository.save(job);

      const bucket = this.configService.get<string>('S3_BUCKET_GENERATIONS') ?? '';
      // Get presigned URL for face photo to pass to Kling
      const facePhotoUrl = await this.storageService.getPresignedDownloadUrl(
        bucket,
        job.facePhotoS3Key,
        300,
      );

      const video = job.purchase?.video;
      if (!video?.originalS3Key) {
        throw new Error('Original video S3 key is missing');
      }

      const videosBucket = this.configService.get<string>('S3_BUCKET_VIDEOS') ?? '';
      const referenceVideoUrl = await this.storageService.getPresignedDownloadUrl(
        videosBucket,
        video.originalS3Key,
        300,
      );

      const taskId = await this.klingClient.createVideoTask(referenceVideoUrl, facePhotoUrl);
      job.klingTaskId = taskId;
      await this.jobsRepository.save(job);

      // Polling loop
      let attempts = 0;
      while (attempts < MAX_POLL_ATTEMPTS) {
        await this.sleep(POLL_INTERVAL_MS);
        const taskStatus = await this.klingClient.pollTaskStatus(taskId);

        if (taskStatus.status === 'succeed' && taskStatus.resultVideoUrl) {
          job.resultVideoUrl = taskStatus.resultVideoUrl;
          job.status = GenerationJobStatus.COMPLETED;
          await this.jobsRepository.save(job);
          await this.notificationsService.sendGenerationComplete(job.user?.email ?? '', job.id);
          return;
        }

        if (taskStatus.status === 'failed') {
          throw new Error('Kling AI reported task failure');
        }

        attempts++;
      }

      throw new Error('Kling AI polling timed out after max attempts');
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Generation job ${job.id} failed: ${error.message}`);
      job.status = GenerationJobStatus.FAILED;
      job.errorMessage = error.message;
      await this.jobsRepository.save(job);
      await this.notificationsService.sendGenerationFailed(job.user?.email ?? '', job.id);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
