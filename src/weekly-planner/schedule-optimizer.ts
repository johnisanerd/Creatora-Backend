import { SocialPlatform } from "@prisma/client";
import { PostFormat } from "./weekly-plan.interface";

export interface PostingWindow {
  /** 0 = Monday … 6 = Sunday */
  preferredDays: number[];
  /** "HH:MM" 24-hour */
  preferredTime: string;
}

/**
 * Returns opinionated best-time suggestions for a given platform + format combo.
 * The Gemini prompt uses this as a soft constraint; the model can override when
 * it has good reason (e.g. a festive post on an unusual day).
 */
export function getBestPostingWindow(
  platform: SocialPlatform,
  format: PostFormat,
): PostingWindow {
  const windows: Record<string, PostingWindow> = {
    INSTAGRAM_Reel: { preferredDays: [1, 4], preferredTime: '09:00' },
    INSTAGRAM_Carousel: { preferredDays: [2, 6], preferredTime: '11:00' },
    INSTAGRAM_Story: { preferredDays: [0, 3], preferredTime: '18:00' },
    INSTAGRAM_default: { preferredDays: [1, 4], preferredTime: '09:00' },
    YOUTUBE_default: { preferredDays: [4], preferredTime: '15:00' },
    FACEBOOK_Carousel: { preferredDays: [6], preferredTime: '18:00' },
    FACEBOOK_default: { preferredDays: [2, 5], preferredTime: '12:00' },
    TWITTER_default: { preferredDays: [0, 2, 4], preferredTime: '10:00' },
    LINKEDIN_default: { preferredDays: [1, 3], preferredTime: '08:00' },
    THREAD_default: { preferredDays: [1, 4], preferredTime: '20:00' },
    BLOG_default: { preferredDays: [2, 5], preferredTime: '10:00' },
    EMAIL_default: { preferredDays: [1, 3], preferredTime: '09:00' },
  };

  const normalised = format?.split('/')[0]?.trim() ?? '';
  const key = `${platform}_${normalised}`;
  return windows[key] ?? windows[`${platform}_default`] ?? { preferredDays: [1], preferredTime: '09:00' };
}

/**
 * Returns the ISO date string for the Monday of the week that contains `date`.
 */
export function getWeekMonday(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day; // shift so Monday = start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Adds `days` to a date, returns a new Date.
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Formats a Date as "YYYY-MM-DD".
 */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}