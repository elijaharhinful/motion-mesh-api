import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

/**
 * Data-access layer for the User entity. ALL database access for users lives
 * here — services depend on this, never on the repository directly.
 * See docs/MotionMesh_ModuleGuide_v1_1.md (Actions Layer).
 */
@Injectable()
export class UserActions {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByIdWithCreatorProfile(id: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id },
      relations: { creatorProfile: true },
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  findByEmailWithCreatorProfile(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email },
      relations: { creatorProfile: true },
    });
  }

  /** Login lookup: includes passwordHash (normally hidden) + creatorProfile for isSeller. */
  findForAuth(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        lastActiveMode: true,
        isEmailVerified: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      relations: { creatorProfile: true },
    });
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.repo.findOne({
      where: { googleId },
      relations: { creatorProfile: true },
    });
  }

  create(data: DeepPartial<User>): User {
    return this.repo.create(data);
  }

  save(user: User): Promise<User> {
    return this.repo.save(user);
  }

  remove(user: User): Promise<User> {
    return this.repo.remove(user);
  }
}
