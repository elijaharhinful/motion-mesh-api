import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Purchase } from '../entities/purchase.entity';
import { PurchaseStatus } from '../enums/purchase-status.enum';

/** Data-access layer for Purchase. All DB access for purchases lives here. */
@Injectable()
export class PurchaseActions {
  constructor(
    @InjectRepository(Purchase)
    private readonly repo: Repository<Purchase>,
  ) {}

  findSucceededByUserAndVideo(
    userId: string,
    videoId: string,
  ): Promise<Purchase | null> {
    return this.repo.findOne({
      where: { userId, videoId, status: PurchaseStatus.SUCCEEDED },
    });
  }

  findSucceededByIdForUser(
    purchaseId: string,
    userId: string,
  ): Promise<Purchase | null> {
    return this.repo.findOne({
      where: { id: purchaseId, userId, status: PurchaseStatus.SUCCEEDED },
    });
  }

  findByPaymentIntentId(
    stripePaymentIntentId: string,
  ): Promise<Purchase | null> {
    return this.repo.findOne({ where: { stripePaymentIntentId } });
  }

  listSucceededByUser(userId: string): Promise<Purchase[]> {
    return this.repo.find({
      where: { userId, status: PurchaseStatus.SUCCEEDED },
      relations: { video: true },
      order: { createdAt: 'DESC' },
    });
  }

  updateStatusByPaymentIntentId(
    stripePaymentIntentId: string,
    status: PurchaseStatus,
  ): Promise<unknown> {
    return this.repo.update({ stripePaymentIntentId }, { status });
  }

  create(data: DeepPartial<Purchase>): Purchase {
    return this.repo.create(data);
  }

  save(purchase: Purchase): Promise<Purchase> {
    return this.repo.save(purchase);
  }
}
