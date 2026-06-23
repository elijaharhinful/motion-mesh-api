import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant';
import { VideoStatus } from '../videos/enums/video-status.enum';
import { DanceVideoActions } from '../videos/actions/dance-video.actions';
import { Purchase } from './entities/purchase.entity';
import { PurchaseStatus } from './enums/purchase-status.enum';
import { PurchaseActions } from './actions/purchase.actions';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly commissionPercent: number;

  constructor(
    private readonly purchaseActions: PurchaseActions,
    private readonly videoActions: DanceVideoActions,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') ?? '',
      { apiVersion: '2026-02-25.clover' },
    );
    this.commissionPercent =
      this.configService.get<number>('PLATFORM_COMMISSION_PERCENT') ?? 30;
  }

  async createPaymentIntent(
    userId: string,
    dto: CreatePaymentIntentDto,
  ): Promise<{ clientSecret: string; purchaseId: string }> {
    const video = await this.videoActions.findByIdWithCreator(dto.videoId);

    if (!video) throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    if (video.status !== VideoStatus.PUBLISHED) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_PUBLISHED);
    }

    // Check duplicate purchase
    const existing = await this.purchaseActions.findSucceededByUserAndVideo(
      userId,
      dto.videoId,
    );
    if (existing) {
      throw new ConflictException(ERROR_MESSAGES.ALREADY_PURCHASED);
    }

    const amountCents = video.priceCents;
    const platformFeeCents = Math.round(
      amountCents * (this.commissionPercent / 100),
    );
    const creatorPayoutCents = amountCents - platformFeeCents;

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: { userId, videoId: dto.videoId },
    });

    const purchase = this.purchaseActions.create({
      userId,
      videoId: dto.videoId,
      stripePaymentIntentId: paymentIntent.id,
      amountCents,
      platformFeeCents,
      creatorPayoutCents,
      status: PurchaseStatus.PENDING,
    });
    const saved = await this.purchaseActions.save(purchase);

    return {
      clientSecret: paymentIntent.client_secret ?? '',
      purchaseId: saved.id,
    };
  }

  async confirmPurchase(stripePaymentIntentId: string): Promise<void> {
    await this.purchaseActions.updateStatusByPaymentIntentId(
      stripePaymentIntentId,
      PurchaseStatus.SUCCEEDED,
    );
  }

  async markPurchaseFailed(stripePaymentIntentId: string): Promise<void> {
    await this.purchaseActions.updateStatusByPaymentIntentId(
      stripePaymentIntentId,
      PurchaseStatus.FAILED,
    );
  }

  async listUserPurchases(userId: string): Promise<Purchase[]> {
    return this.purchaseActions.listSucceededByUser(userId);
  }

  async findByPaymentIntentId(
    stripePaymentIntentId: string,
  ): Promise<Purchase | null> {
    return this.purchaseActions.findByPaymentIntentId(stripePaymentIntentId);
  }
}
