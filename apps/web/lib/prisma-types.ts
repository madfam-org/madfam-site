// Temporary Prisma enum definitions
// These match the enums in prisma/schema.prisma
// Remove this file once Prisma client is properly generated

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  UNQUALIFIED = 'UNQUALIFIED',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST',
}

export enum LeadSource {
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  SOCIAL = 'SOCIAL',
  EVENT = 'EVENT',
  DIRECT = 'DIRECT',
  OTHER = 'OTHER',
  DEMO_REQUEST = 'DEMO_REQUEST',
  ROI_CALCULATOR = 'ROI_CALCULATOR',
  CONTACT_FORM = 'CONTACT_FORM',
  ASSESSMENT = 'ASSESSMENT',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum AssessmentStatus {
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}
