import { AfterLoad, Column, Entity, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { CreatorProfile } from '../../creators/entities/creator-profile.entity';
import { UserRole } from '../enums/user-role.enum';
import { ActiveMode } from '../enums/active-mode.enum';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ type: 'varchar', nullable: true, select: false })
  passwordHash: string | null;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role: UserRole;

  /** Non-authoritative UI preference so a returning device restores the last workspace. */
  @Column({ type: 'enum', enum: ActiveMode, nullable: true })
  lastActiveMode: ActiveMode | null;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', nullable: true, unique: true })
  googleId: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @OneToOne(() => CreatorProfile, (profile) => profile.user, {
    nullable: true,
    cascade: false,
  })
  creatorProfile: CreatorProfile | null;

  /**
   * Derived seller capability — true when an active CreatorProfile exists.
   * Not a column; populated after load and serialized in responses so the
   * frontend can render the correct mode control. Only accurate when the
   * `creatorProfile` relation is loaded (auth + /users/me paths load it).
   */
  isSeller = false;

  @AfterLoad()
  private deriveIsSeller(): void {
    this.isSeller = !!this.creatorProfile;
  }
}
