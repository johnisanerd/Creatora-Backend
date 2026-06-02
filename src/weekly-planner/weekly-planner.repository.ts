import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WeeklyPlan } from '@prisma/client';
import { WeeklyPlanData } from './weekly-plan.interface';

@Injectable()
export class WeeklyPlannerRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── User ────────────────────────────────────────────────────────────────

  async getUserWithBrandProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { brandProfile: true },
    });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    return user;
  }

  // ─── Content ideas ────────────────────────────────────────────────────────

  async getFavoriteIdeas(userId: string) {
    return this.prisma.contentIdea.findMany({
      where: { userId, isFavorite: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Generated posts ──────────────────────────────────────────────────────

  async getRecentGeneratedPosts(userId: string, limit = 10) {
    return this.prisma.generatedPost.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { sourceIdea: true },
    });
  }

  // ─── Weekly plan CRUD ─────────────────────────────────────────────────────

  async getPlanForWeek(
    userId: string,
    weekStart: Date,
  ): Promise<WeeklyPlan | null> {
    return this.prisma.weeklyPlan.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
    });
  }

  async getPlanById(planId: string, userId: string): Promise<WeeklyPlan> {
    const plan = await this.prisma.weeklyPlan.findFirst({
      where: { id: planId, userId },
    });
    if (!plan) throw new NotFoundException(`Weekly plan ${planId} not found`);
    return plan;
  }

  /**
   * Creates or replaces the plan for a given week.
   * Uses upsert so "regenerate" naturally overwrites the previous plan.
   */
  async upsertPlan(
    userId: string,
    weekStart: Date,
    planData: WeeklyPlanData,
  ): Promise<WeeklyPlan> {
    try {
      return await this.prisma.weeklyPlan.upsert({
        where: { userId_weekStart: { userId, weekStart } },
        create: {
          userId,
          weekStart,
          plan: planData as any,
        },
        update: {
          plan: planData as any,
        },
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to save weekly plan',
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  /** Persist partial plan updates (slot edits, mark-posted, etc.) */
  async savePlanData(
    planId: string,
    userId: string,
    planData: WeeklyPlanData,
  ): Promise<WeeklyPlan> {
    const existing = await this.getPlanById(planId, userId);
    if (!existing) throw new NotFoundException(`Plan ${planId} not found`);

    return this.prisma.weeklyPlan.update({
      where: { id: planId },
      data: { plan: planData as any },
    });
  }

  /** Returns all plans for a user, newest first. */
  async getPlanHistory(userId: string): Promise<WeeklyPlan[]> {
    return this.prisma.weeklyPlan.findMany({
      where: { userId },
      orderBy: { weekStart: 'desc' },
    });
  }

  async deletePlan(planId: string, userId: string): Promise<void> {
    const existing = await this.getPlanById(planId, userId);
    if (!existing) throw new NotFoundException(`Plan ${planId} not found`);
    await this.prisma.weeklyPlan.delete({ where: { id: planId } });
  }
}