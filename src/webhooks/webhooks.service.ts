import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WebhooksService {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly paymentsService: PaymentsService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.stripe = new Stripe(
      configService.get<string>('STRIPE_SECRET_KEY') ?? '',
      { apiVersion: '2026-02-25.clover' },
    );
    this.webhookSecret = configService.get<string>('STRIPE_WEBHOOK_SECRET') ?? '';
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (err) {
      this.logger.warn(`Webhook signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    this.logger.log(`Received Stripe event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.paymentsService.confirmPurchase(pi.id);
        this.logger.log(`Purchase confirmed for PaymentIntent ${pi.id}`);
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.paymentsService.markPurchaseFailed(pi.id);
        this.logger.log(`Purchase failed for PaymentIntent ${pi.id}`);
        break;
      }
      case 'account.updated': {
        // Stripe Connect account updated — can be used to update creator verification
        const account = event.data.object as Stripe.Account;
        this.logger.log(`Stripe Connect account updated: ${account.id}`);
        break;
      }
      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;
        this.logger.log(`Payout completed: ${payout.id}, amount: ${payout.amount}`);
        break;
      }
      default:
        this.logger.verbose(`Unhandled Stripe event type: ${event.type}`);
    }
  }
}
