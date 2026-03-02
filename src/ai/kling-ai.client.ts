import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constant';

export interface KlingVideoTask {
  taskId: string;
  status: 'submitted' | 'processing' | 'succeed' | 'failed';
  resultVideoUrl?: string;
}

@Injectable()
export class KlingAiClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly logger = new Logger(KlingAiClient.name);

  constructor(private readonly configService: ConfigService) {
    this.apiKey = configService.get<string>('KLING_API_KEY') ?? '';
    this.baseUrl = configService.get<string>('KLING_API_BASE_URL') ?? '';
  }

  async createVideoTask(
    referenceVideoUrl: string,
    faceImageUrl: string,
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/videos/human-dance-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        reference_video: referenceVideoUrl,
        face_image: faceImageUrl,
        output_type: 'mp4',
      }),
    });

    if (!response.ok) {
      this.logger.error(`Kling API error: ${response.status} ${response.statusText}`);
      throw new InternalServerErrorException(ERROR_MESSAGES.KLING_API_ERROR);
    }

    const data = (await response.json()) as { task_id: string };
    return data.task_id;
  }

  async pollTaskStatus(taskId: string): Promise<KlingVideoTask> {
    const response = await fetch(`${this.baseUrl}/v1/videos/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!response.ok) {
      this.logger.error(`Kling poll error: ${response.status}`);
      throw new InternalServerErrorException(ERROR_MESSAGES.KLING_API_ERROR);
    }

    const data = (await response.json()) as {
      task_id: string;
      status: KlingVideoTask['status'];
      result_url?: string;
    };

    return {
      taskId: data.task_id,
      status: data.status,
      resultVideoUrl: data.result_url,
    };
  }
}
