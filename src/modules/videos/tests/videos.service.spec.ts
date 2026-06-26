import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VideosService } from '../videos.service';
import { DanceVideoActions } from '../actions/dance-video.actions';
import { StorageService } from '../../storage/storage.service';
import { DanceVideo } from '../entities/dance-video.entity';
import { VideoStatus } from '../enums/video-status.enum';
import { VideoDifficulty } from '../enums/video-difficulty.enum';
import { VideoCategory } from '../enums/video-category.enum';

const CREATOR_ID = 'creator-1';

const buildVideo = (overrides: Partial<DanceVideo> = {}): DanceVideo =>
  ({
    id: 'video-1',
    creatorId: CREATOR_ID,
    title: 'Hip-Hop Basics',
    description: 'A short routine',
    difficulty: VideoDifficulty.BEGINNER,
    category: VideoCategory.HIP_HOP,
    priceCents: 1999,
    status: VideoStatus.DRAFT,
    originalS3Key: null,
    previewS3Key: null,
    thumbnailS3Key: null,
    durationSeconds: 42,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as unknown as DanceVideo;

describe('VideosService', () => {
  let service: VideosService;
  let actions: jest.Mocked<DanceVideoActions>;
  let storage: jest.Mocked<StorageService>;

  beforeEach(() => {
    actions = {
      findById: jest.fn(),
      findByIdWithCreatorAndUser: jest.fn(),
      findByCreator: jest.fn(),
      listPublished: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<DanceVideoActions>;

    storage = {
      getPresignedUploadUrl: jest.fn().mockResolvedValue('https://s3/put'),
      getPresignedDownloadUrl: jest
        .fn()
        .mockImplementation((_b: string, key: string) =>
          Promise.resolve(`https://s3/signed/${key}`),
        ),
    } as unknown as jest.Mocked<StorageService>;

    const config = {
      get: jest.fn().mockReturnValue('mm-bucket'),
    } as unknown as ConfigService;

    service = new VideosService(actions, storage, config);
  });

  describe('create', () => {
    it('creates a draft listing from the DTO', async () => {
      const created = buildVideo();
      actions.create.mockReturnValue(created);
      actions.save.mockResolvedValue(created);

      const result = await service.create(CREATOR_ID, {
        title: 'Hip-Hop Basics',
        difficulty: VideoDifficulty.BEGINNER,
        category: VideoCategory.HIP_HOP,
        priceCents: 1999,
      });

      expect(actions.create).toHaveBeenCalledWith(
        expect.objectContaining({ creatorId: CREATOR_ID, priceCents: 1999 }),
      );
      expect(result).toBe(created);
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('signs a PUT URL and persists the key on the listing', async () => {
      const video = buildVideo();
      actions.findById.mockResolvedValue(video);
      actions.save.mockImplementation((v) => Promise.resolve(v));

      const result = await service.getPresignedUploadUrl(
        'video-1',
        CREATOR_ID,
        'original',
        'video/mp4',
      );

      expect(result.url).toBe('https://s3/put');
      expect(result.key).toContain('videos/original/video-1/');
      expect(video.originalS3Key).toBe(result.key);
      expect(actions.save).toHaveBeenCalledWith(video);
    });

    it('rejects a non-owner', async () => {
      actions.findById.mockResolvedValue(
        buildVideo({ creatorId: 'someone-else' }),
      );
      await expect(
        service.getPresignedUploadUrl('video-1', CREATOR_ID, 'original', 'm'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('publishVideo', () => {
    it('publishes when an original has been uploaded', async () => {
      const video = buildVideo({ originalS3Key: 'videos/original/video-1/1' });
      actions.findById.mockResolvedValue(video);
      actions.save.mockImplementation((v) => Promise.resolve(v));

      const result = await service.publishVideo('video-1', CREATOR_ID);

      expect(result.status).toBe(VideoStatus.PUBLISHED);
      expect(result.hasOriginal).toBe(true);
    });

    it('refuses to publish without an original file', async () => {
      actions.findById.mockResolvedValue(buildVideo({ originalS3Key: null }));
      await expect(service.publishVideo('video-1', CREATOR_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFound for a missing video', async () => {
      actions.findById.mockResolvedValue(null);
      await expect(service.publishVideo('nope', CREATOR_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('unpublishVideo', () => {
    it('reverts a published listing to draft', async () => {
      const video = buildVideo({ status: VideoStatus.PUBLISHED });
      actions.findById.mockResolvedValue(video);
      actions.save.mockImplementation((v) => Promise.resolve(v));

      const result = await service.unpublishVideo('video-1', CREATOR_ID);
      expect(result.status).toBe(VideoStatus.DRAFT);
    });
  });

  describe('list', () => {
    it('maps published videos to public views with a signed thumbnail and no preview', async () => {
      actions.listPublished.mockResolvedValue([
        buildVideo({
          status: VideoStatus.PUBLISHED,
          thumbnailS3Key: 'videos/thumbnail/video-1/1',
          previewS3Key: 'videos/preview/video-1/1',
          originalS3Key: 'videos/original/video-1/1',
        }),
      ]);

      const [view] = await service.list({});

      expect(view.thumbnailUrl).toBe(
        'https://s3/signed/videos/thumbnail/video-1/1',
      );
      // Preview is withheld from the list view; original is never exposed.
      expect(view.previewUrl).toBeNull();
      expect(view).not.toHaveProperty('originalS3Key');
      expect(view).not.toHaveProperty('previewS3Key');
    });
  });

  describe('getById', () => {
    it('returns a public view with a signed preview for a published video', async () => {
      actions.findByIdWithCreatorAndUser.mockResolvedValue(
        buildVideo({
          status: VideoStatus.PUBLISHED,
          previewS3Key: 'videos/preview/video-1/1',
        }),
      );

      const view = await service.getById('video-1');
      expect(view.previewUrl).toBe(
        'https://s3/signed/videos/preview/video-1/1',
      );
      expect(view).not.toHaveProperty('originalS3Key');
    });

    it('hides an unpublished video behind NotFound', async () => {
      actions.findByIdWithCreatorAndUser.mockResolvedValue(
        buildVideo({ status: VideoStatus.DRAFT }),
      );
      await expect(service.getById('video-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFound for a missing video', async () => {
      actions.findByIdWithCreatorAndUser.mockResolvedValue(null);
      await expect(service.getById('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listMine', () => {
    it('returns seller views with upload-completeness flags', async () => {
      actions.findByCreator.mockResolvedValue([
        buildVideo({
          originalS3Key: 'videos/original/video-1/1',
          thumbnailS3Key: null,
        }),
      ]);

      const [view] = await service.listMine(CREATOR_ID);
      expect(view.hasOriginal).toBe(true);
      expect(view.hasThumbnail).toBe(false);
      expect(actions.findByCreator).toHaveBeenCalledWith(CREATOR_ID);
    });
  });

  describe('update', () => {
    it('applies the patch and returns a seller view', async () => {
      const video = buildVideo();
      actions.findById.mockResolvedValue(video);
      actions.save.mockImplementation((v) => Promise.resolve(v));

      const result = await service.update('video-1', CREATOR_ID, {
        title: 'Renamed',
      });
      expect(result.title).toBe('Renamed');
    });
  });

  describe('delete', () => {
    it('removes a listing owned by the creator', async () => {
      const video = buildVideo();
      actions.findById.mockResolvedValue(video);
      actions.remove.mockResolvedValue(video);

      await service.delete('video-1', CREATOR_ID);
      expect(actions.remove).toHaveBeenCalledWith(video);
    });

    it('rejects deleting a video the creator does not own', async () => {
      actions.findById.mockResolvedValue(buildVideo({ creatorId: 'other' }));
      await expect(service.delete('video-1', CREATOR_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
