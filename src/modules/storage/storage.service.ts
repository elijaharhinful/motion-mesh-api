import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(StorageService.name);
  private readonly presignedUrlTtl: number;

  constructor(private readonly configService: ConfigService) {
    const endpoint = configService.get<string>('S3_ENDPOINT');
    this.presignedUrlTtl =
      configService.get<number>('S3_PRESIGNED_URL_TTL_SECONDS') ?? 1800;

    this.s3Client = new S3Client({
      region: configService.get<string>('S3_REGION') ?? 'us-east-1',
      credentials: {
        accessKeyId: configService.get<string>('S3_ACCESS_KEY') ?? '',
        secretAccessKey: configService.get<string>('S3_SECRET_KEY') ?? '',
      },
      // Cloudflare R2 (and MinIO) are not S3-checksum compatible. Newer
      // @aws-sdk versions add CRC32 integrity headers by default, which get
      // baked into presigned-URL signatures and cause uploads to fail. Only
      // calculate/validate checksums when the operation actually requires it.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });
  }

  async getPresignedUploadUrl(
    bucket: string,
    key: string,
    contentType: string,
    ttlSeconds?: number,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3Client, command, {
      expiresIn: ttlSeconds ?? this.presignedUrlTtl,
    });
  }

  async getPresignedDownloadUrl(
    bucket: string,
    key: string,
    ttlSeconds?: number,
  ): Promise<string> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(this.s3Client, command, {
      expiresIn: ttlSeconds ?? this.presignedUrlTtl,
    });
  }

  /**
   * Uploads a buffer to storage from the server side. Used when the app itself
   * (not the browser) is the source of the bytes, e.g. persisting an AI result
   * fetched from a third-party provider into our own bucket.
   */
  async putObject(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: key }),
      );
    } catch (err) {
      this.logger.error(`Failed to delete S3 object ${bucket}/${key}`, err);
    }
  }
}
