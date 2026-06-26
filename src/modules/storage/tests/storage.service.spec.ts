import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageService } from '../storage.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

const mockSend = jest.fn() as jest.Mock<Promise<unknown>, [unknown]>;
jest.mock('@aws-sdk/client-s3', () => {
  const actual =
    jest.requireActual<typeof import('@aws-sdk/client-s3')>(
      '@aws-sdk/client-s3',
    );
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation((config: unknown) => ({
      config,
      send: mockSend,
    })),
  };
});

const getSignedUrlMock = getSignedUrl as jest.MockedFunction<
  typeof getSignedUrl
>;
const S3ClientMock = S3Client as unknown as jest.Mock<unknown, [unknown]>;

const CONFIG: Record<string, string | number> = {
  S3_ENDPOINT: 'https://acct.r2.cloudflarestorage.com',
  S3_REGION: 'auto',
  S3_ACCESS_KEY: 'key',
  S3_SECRET_KEY: 'secret',
  S3_PRESIGNED_URL_TTL_SECONDS: 1800,
};

const buildService = (): StorageService => {
  const configService = {
    get: jest.fn((k: string) => CONFIG[k]),
  } as unknown as ConfigService;
  return new StorageService(configService);
};

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor (R2 compatibility)', () => {
    it('disables S3 checksums and uses a path-style endpoint for R2', () => {
      buildService();
      const config = S3ClientMock.mock.calls[0][0] as {
        requestChecksumCalculation: string;
        responseChecksumValidation: string;
        endpoint: string;
        forcePathStyle: boolean;
      };
      expect(config.requestChecksumCalculation).toBe('WHEN_REQUIRED');
      expect(config.responseChecksumValidation).toBe('WHEN_REQUIRED');
      expect(config.endpoint).toBe(CONFIG.S3_ENDPOINT);
      expect(config.forcePathStyle).toBe(true);
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('signs a PUT for the given bucket/key with the default TTL', async () => {
      getSignedUrlMock.mockResolvedValue('https://signed-put');
      const service = buildService();

      const url = await service.getPresignedUploadUrl(
        'motion-mesh',
        'avatars/u1/123',
        'image/png',
      );

      expect(url).toBe('https://signed-put');
      const command = getSignedUrlMock.mock.calls[0][1] as PutObjectCommand;
      expect(command).toBeInstanceOf(PutObjectCommand);
      expect(command.input).toMatchObject({
        Bucket: 'motion-mesh',
        Key: 'avatars/u1/123',
        ContentType: 'image/png',
      });
      expect(getSignedUrlMock.mock.calls[0][2]).toEqual({ expiresIn: 1800 });
    });

    it('honours an explicit TTL override', async () => {
      getSignedUrlMock.mockResolvedValue('https://signed-put');
      const service = buildService();

      await service.getPresignedUploadUrl('b', 'k', 'image/png', 60);

      expect(getSignedUrlMock.mock.calls[0][2]).toEqual({ expiresIn: 60 });
    });
  });

  describe('getPresignedDownloadUrl', () => {
    it('signs a GET for the given bucket/key', async () => {
      getSignedUrlMock.mockResolvedValue('https://signed-get');
      const service = buildService();

      const url = await service.getPresignedDownloadUrl(
        'motion-mesh',
        'generations/job1/1.mp4',
        300,
      );

      expect(url).toBe('https://signed-get');
      const command = getSignedUrlMock.mock.calls[0][1] as GetObjectCommand;
      expect(command).toBeInstanceOf(GetObjectCommand);
      expect(command.input).toMatchObject({
        Bucket: 'motion-mesh',
        Key: 'generations/job1/1.mp4',
      });
      expect(getSignedUrlMock.mock.calls[0][2]).toEqual({ expiresIn: 300 });
    });
  });

  describe('putObject', () => {
    it('sends a PutObjectCommand with the buffer body', async () => {
      mockSend.mockResolvedValue({});
      const service = buildService();
      const body = Buffer.from('bytes');

      await service.putObject(
        'motion-mesh',
        'generations/j/1.mp4',
        body,
        'video/mp4',
      );

      const command = mockSend.mock.calls[0][0] as PutObjectCommand;
      expect(command).toBeInstanceOf(PutObjectCommand);
      expect(command.input).toMatchObject({
        Bucket: 'motion-mesh',
        Key: 'generations/j/1.mp4',
        Body: body,
        ContentType: 'video/mp4',
      });
    });
  });

  describe('deleteObject', () => {
    it('sends a DeleteObjectCommand', async () => {
      mockSend.mockResolvedValue({});
      const service = buildService();

      await service.deleteObject('motion-mesh', 'avatars/u1/1');

      const command = mockSend.mock.calls[0][0] as DeleteObjectCommand;
      expect(command).toBeInstanceOf(DeleteObjectCommand);
      expect(command.input).toMatchObject({
        Bucket: 'motion-mesh',
        Key: 'avatars/u1/1',
      });
    });

    it('swallows errors so a failed delete does not crash the caller', async () => {
      mockSend.mockRejectedValue(new Error('boom'));
      const service = buildService();

      await expect(
        service.deleteObject('motion-mesh', 'avatars/u1/1'),
      ).resolves.toBeUndefined();
    });
  });
});
