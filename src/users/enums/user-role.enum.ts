/**
 * Account role. Gates ADMIN only. There is NO `creator` role — selling is a
 * capability derived from an active CreatorProfile (see User.isSeller).
 * Authoritative model: docs/MotionMesh_Identity_and_ModeSwitching_Spec_v1_0.md
 */
export enum UserRole {
  MEMBER = 'member',
  ADMIN = 'admin',
}
