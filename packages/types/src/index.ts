export enum Role {
  SEEKER = 'SEEKER',
  SOLVER = 'SOLVER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum Visibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  ANONYMOUS = 'ANONYMOUS',
}

export enum ProblemStatus {
  OPEN = 'OPEN',
  IN_MATCHING = 'IN_MATCHING',
  MATCHED = 'MATCHED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum SolutionType {
  EXISTING_SOFTWARE = 'EXISTING_SOFTWARE',
  EXPERT_CONSULTANT = 'EXPERT_CONSULTANT',
  KNOWLEDGE_PRODUCT = 'KNOWLEDGE_PRODUCT',
  DONE_FOR_YOU_SERVICE = 'DONE_FOR_YOU_SERVICE',
  CUSTOM_BUILD = 'CUSTOM_BUILD',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PlanTier {
  FREE = 'FREE',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
}

export interface UserJwtPayload {
  sub: string;
  email: string;
  role: Role;
  mfaAuthenticated?: boolean;
}
