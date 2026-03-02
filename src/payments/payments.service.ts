import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Repository } from 'typeorm';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constant';
import { DanceVideo, VideoStatus } from '../videos/entities/dance-video.entity';
import { Purchase, PurchaseStatus } from './entities/purchase.entity';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly commissionPercent: number;

  constructor(
    @InjectRepository(Purchase)
    private readonly purchasesRepository: Repository<Purchase>,
    @InjectRepository(DanceVideo)
    private readonly videosRepository: Repository<DanceVideo>,
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
    const video = await this.videosRepository.findOne({
      where: { id: dto.videoId },
      relations: ['creator'],
    });

    if (!video) throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    if (video.status !== VideoStatus.PUBLISHED) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_PUBLISHED);
    }

    // Check duplicate purchase
    const existing = await this.purchasesRepository.findOne({
      where: { userId, videoId: dto.videoId, status: PurchaseStatus.SUCCEEDED },
    });
    if (existing) {
      throw new ConflictException(ERROR_MESSAGES.ALREADY_PURCHASED);
    }

    const amountCents = video.priceCents;
    const platformFeeCents = Math.round(amountCents * (this.commissionPercent / 100));
    const creatorPayoutCents = amountCents - platformFeeCents;

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: { userId, videoId: dto.videoId },
    });

    const purchase = this.purchasesRepository.create({
      userId,
      videoId: dto.videoId,
      stripePaymentIntentId: paymentIntent.id,
      amountCents,
      platformFeeCents,
      creatorPayoutCents,
      status: PurchaseStatus.PENDING,
    });
    const saved = await this.purchasesRepository.save(purchase);

    return {
      clientSecret: paymentIntent.client_secret ?? '',
      purchaseId: saved.id,
    };
  }

  async confirmPurchase(stripePaymentIntentId: string): Promise<void> {
    await this.purchasesRepository.update(
      { stripePaymentIntentId },
      { status: PurchaseStatus.SUCCEEDED },
    );
  }

  async markPurchaseFailed(stripePaymentIntentId: string): Promise<void> {
    await this.purchasesRepository.update(
      { stripePaymentIntentId },
      { status: PurchaseStatus.FAILED },
    );
  }

  async listUserPurchases(userId: string): Promise<Purchase[]> {
    return this.purchasesRepository.find({
      where: { userId, status: PurchaseStatus.SUCCEEDED },
      relations: ['video'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByPaymentIntentId(stripePaymentIntentId: string): Promise<Purchase | null> {
    return this.purchasesRepository.findOne({
      where: { stripePaymentIntentId },
    });
  }
}
