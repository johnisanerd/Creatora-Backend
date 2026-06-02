export type SocialPlatform =
  | 'TWITTER'
  | 'LINKEDIN'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'YOUTUBE'
  | 'BLOG'
  | 'EMAIL'
  | 'THREAD';

export type PostFormat =
  | 'Reel'
  | 'Carousel'
  | 'Talking-head'
  | 'BTS'
  | 'Trend hijack'
  | 'Story/Poll'
  | 'POV'
  | 'Behind-the-scenes'
  | 'Day-in-the-life'
  | string;

export type PostSourceType = 'GENERATED' | 'IDEA' | 'NEW';

export type PostStatus = 'SCHEDULED' | 'POSTED' | 'SKIPPED';

export type ReminderType =
  | 'HARVEST'
  | 'ENGAGEMENT_CHECK'
  | 'CONTENT_PREP'
  | 'GENERAL';

export interface ScheduledPost {
  id: string;
  /** 0 = Monday … 6 = Sunday */
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** "HH:MM" in 24-hour format */
  scheduledTime: string;
  platform: SocialPlatform;
  format: PostFormat;
  title: string;
  caption: string;
  hashtags: string[];
  /** Populated when post originates from a ContentIdea */
  contentIdeaId?: string | null;
  /** Populated when post reuses an existing GeneratedPost */
  generatedPostId?: string | null;
  sourceType: PostSourceType;
  status: PostStatus;
  /** AI explanation for why this slot was chosen */
  aiRationale: string;
}

export interface PlanReminder {
  id: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  scheduledTime: string;
  title: string;
  description: string;
  type: ReminderType;
}

export interface WeeklyPlanData {
  /** ISO date string, always a Monday */
  weekStart: string;
  generatedAt: string;
  /** One-sentence AI rationale for the overall plan */
  summary: string;
  posts: ScheduledPost[];
  reminders: PlanReminder[];
  /** IDs of favorited ideas that were NOT placed this week */
  unscheduledIdeaIds: string[];
}