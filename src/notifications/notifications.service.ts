import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly transporter: nodemailer.Transporter;
  private readonly fromAddress: string;
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly configService: ConfigService) {
    this.fromAddress = configService.get<string>('EMAIL_FROM') ?? 'MotionMesh <no-reply@motionmesh.com>';
    this.transporter = nodemailer.createTransport({
      host: configService.get<string>('SMTP_HOST'),
      port: configService.get<number>('SMTP_PORT') ?? 587,
      secure: false,
      auth: {
        user: configService.get<string>('SMTP_USER'),
        pass: configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendGenerationComplete(toEmail: string, jobId: string): Promise<void> {
    await this.send(
      toEmail,
      '🎉 Your MotionMesh video is ready!',
      `<p>Your AI-generated dance video (Job ID: <strong>${jobId}</strong>) is ready to download.</p>
       <p>Log in to MotionMesh to view and share your video!</p>`,
    );
  }

  async sendGenerationFailed(toEmail: string, jobId: string): Promise<void> {
    await this.send(
      toEmail,
      '⚠️ MotionMesh video generation failed',
      `<p>We're sorry — your AI-generated dance video (Job ID: <strong>${jobId}</strong>) could not be created.</p>
       <p>Our team has been notified. You will receive a refund within 3-5 business days.</p>`,
    );
  }

  async sendPayoutNotification(toEmail: string, amountCents: number): Promise<void> {
    const amount = (amountCents / 100).toFixed(2);
    await this.send(
      toEmail,
      `💰 MotionMesh payout of $${amount} is on its way!`,
      `<p>Your payout of <strong>$${amount}</strong> has been initiated and will arrive in your bank account within 2-5 business days.</p>`,
    );
  }

  // ─── Generic send helper ────────────────────────────────────────────────────

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
    }
  }
}
