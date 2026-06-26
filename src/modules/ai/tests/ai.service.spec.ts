import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { AiService } from '../ai.service';
import { GenerationJobActions } from '../actions/generation-job.actions';
import { PurchaseActions } from '../../payments/actions/purchase.actions';
import { StorageService } from '../../storage/storage.service';
import { GenerationJob } from '../entities/generation-job.entity';
import { GenerationJobStatus } from '../enums/generation-job-status.enum';

const buildJob = (overrides: Partial<GenerationJob> = {}): GenerationJob =>
  ({
    id: 'job-1',
    userId: 'user-1',
    purchaseId: 'purchase-1',
    facePhotoS3Key: 'uploads/user-1/1',
    resultVideoS3Key: null,
    resultVideoUrl: null,
    status: GenerationJobStatus.PENDING,
    ...overrides,
  }) as unknown as GenerationJob;

describe('AiService', () => {
  let service: AiService;
  let jobActions: jest.Mocked<GenerationJobActions>;
  let purchaseActions: jest.Mocked<PurchaseActions>;
  let aiQueue: jest.Mocked<Queue>;
  let storageService: jest.Mocked<StorageService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    jobActions = {
      create: jest.fn(),
      save: jest.fn(),
      findByIdWithPurchase: jest.fn(),
    } as unknown as jest.Mocked<GenerationJobActions>;

    purchaseActions = {
      findSucceededByIdForUser: jest.fn(),
    } as unknown as jest.Mocked<PurchaseActions>;

    aiQueue = { add: jest.fn() } as unknown as jest.Mocked<Queue>;

    storageService = {
      getPresignedUploadUrl: jest.fn(),
      getPresignedDownloadUrl: jest.fn(),
    } as unknown as jest.Mocked<StorageService>;

    configService = {
      get: jest.fn(() => 'motion-mesh'),
    } as unknown as jest.Mocked<ConfigService>;

    service = new AiService(
      jobActions,
      purchaseActions,
      aiQueue,
      storageService,
      configService,
    );
  });

  describe('getFacePhotoUploadUrl', () => {
    it('signs a PUT under the uploads/<userId>/ prefix', async () => {
      storageService.getPresignedUploadUrl.mockResolvedValue('https://put');

      const result = await service.getFacePhotoUploadUrl(
        'user-1',
        'image/jpeg',
      );

      expect(result.url).toBe('https://put');
      expect(result.key).toMatch(/^uploads\/user-1\/\d+$/);
      expect(storageService.getPresignedUploadUrl).toHaveBeenCalledWith(
        'motion-mesh',
        result.key,
        'image/jpeg',
      );
    });
  });

  describe('triggerGeneration', () => {
    it('creates a job and enqueues processing for a valid purchase', async () => {
      purchaseActions.findSucceededByIdForUser.mockResolvedValue({
        id: 'purchase-1',
      } as never);
      const job = buildJob();
      jobActions.create.mockReturnValue(job);
      jobActions.save.mockResolvedValue(job);

      const result = await service.triggerGeneration('user-1', {
        purchaseId: 'purchase-1',
        facePhotoS3Key: 'uploads/user-1/1',
      });

      expect(result).toBe(job);
      expect(aiQueue.add).toHaveBeenCalledWith('process-generation', {
        jobId: 'job-1',
      });
    });

    it('throws NotFound when the purchase is missing', async () => {
      purchaseActions.findSucceededByIdForUser.mockResolvedValue(null);
      await expect(
        service.triggerGeneration('user-1', {
          purchaseId: 'missing',
          facePhotoS3Key: 'k',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getResultDownloadUrl', () => {
    it('signs a GET for the result key of an owned, completed job', async () => {
      jobActions.findByIdWithPurchase.mockResolvedValue(
        buildJob({
          status: GenerationJobStatus.COMPLETED,
          resultVideoS3Key: 'generations/job-1/1.mp4',
        }),
      );
      storageService.getPresignedDownloadUrl.mockResolvedValue('https://get');

      const result = await service.getResultDownloadUrl('job-1', 'user-1');

      expect(result.url).toBe('https://get');
      expect(storageService.getPresignedDownloadUrl).toHaveBeenCalledWith(
        'motion-mesh',
        'generations/job-1/1.mp4',
      );
    });

    it('throws NotFound when the result is not ready', async () => {
      jobActions.findByIdWithPurchase.mockResolvedValue(buildJob());
      await expect(
        service.getResultDownloadUrl('job-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws Forbidden when the job belongs to another user', async () => {
      jobActions.findByIdWithPurchase.mockResolvedValue(
        buildJob({ userId: 'someone-else' }),
      );
      await expect(
        service.getResultDownloadUrl('job-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
