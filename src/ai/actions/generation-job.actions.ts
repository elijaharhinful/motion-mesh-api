import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { GenerationJob } from '../entities/generation-job.entity';

/** Data-access layer for GenerationJob. All DB access for AI jobs lives here. */
@Injectable()
export class GenerationJobActions {
  constructor(
    @InjectRepository(GenerationJob)
    private readonly repo: Repository<GenerationJob>,
  ) {}

  findByIdWithPurchase(id: string): Promise<GenerationJob | null> {
    return this.repo.findOne({ where: { id }, relations: { purchase: true } });
  }

  /** Full graph needed by the queue processor (user + purchase + its video). */
  findByIdWithRelations(id: string): Promise<GenerationJob | null> {
    return this.repo.findOne({
      where: { id },
      relations: { user: true, purchase: { video: true } },
    });
  }

  create(data: DeepPartial<GenerationJob>): GenerationJob {
    return this.repo.create(data);
  }

  save(job: GenerationJob): Promise<GenerationJob> {
    return this.repo.save(job);
  }
}
