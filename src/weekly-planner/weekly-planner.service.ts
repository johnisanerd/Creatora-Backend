import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import { WeeklyPlannerRepository } from './weekly-planner.repository';
import { getWeekMonday } from './schedule-optimizer';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { buildPlanPrompt } from './plan-generator.prompt';
import { UpdateSlotDto } from './dto/update-slot.dto';
import {
  PlanReminder,
  ScheduledPost,
  WeeklyPlanData,
} from './weekly-plan.interface';

@Injectable()
export class WeeklyPlannerService {
  private readonly logger = new Logger(WeeklyPlannerService.name);
  private readonly gemini: GoogleGenerativeAI;

  constructor(
    private readonly repo: WeeklyPlannerRepository,
    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.getOrThrow<string>('GEMINI_API_KEY');
    this.gemini = new GoogleGenerativeAI(apiKey);
  }

  // ─── Generate / regenerate ────────────────────────────────────────────────

  async generatePlan(userId: string, dto: GeneratePlanDto) {
    const weekStart = dto.weekStart
      ? getWeekMonday(new Date(dto.weekStart))
      : getWeekMonday();

    // Fetch all data in parallel
    const [user, favoriteIdeas, recentPosts] = await Promise.all([
      this.repo.getUserWithBrandProfile(userId),
      this.repo.getFavoriteIdeas(userId),
      this.repo.getRecentGeneratedPosts(userId, 10),
    ]);

    if (!user.brandProfile) {
      throw new InternalServerErrorException(
        'Brand profile not found. Complete your profile setup first.',
      );
    }

    const prompt = buildPlanPrompt({
      brandProfile: user.brandProfile,
      favoriteIdeas,
      recentPosts,
      weekStart,
    });

    const rawJson = await this.callGemini(prompt);
    const planData = this.parsePlanResponse(rawJson, weekStart);

    const saved = await this.repo.upsertPlan(userId, weekStart, planData);
    return saved;
  }

  // ─── Read ─────────────────────────────────────────────────────────────────

  async getPlanForWeek(userId: string, weekStartStr: string) {
    const weekStart = getWeekMonday(new Date(weekStartStr));
    const plan = await this.repo.getPlanForWeek(userId, weekStart);
    if (!plan) {
      throw new NotFoundException(
        `No plan found for week starting ${weekStartStr}. Generate one first.`,
      );
    }
    return plan;
  }

  async getPlanById(userId: string, planId: string) {
    return this.repo.getPlanById(planId, userId);
  }

  async getPlanHistory(userId: string) {
    return this.repo.getPlanHistory(userId);
  }

  // ─── Slot mutations ───────────────────────────────────────────────────────

  async updateSlot(
    userId: string,
    planId: string,
    slotId: string,
    dto: UpdateSlotDto,
  ) {
    const plan = await this.repo.getPlanById(planId, userId);
    const planData = plan.plan as unknown as WeeklyPlanData;

    const slotIndex = planData.posts.findIndex((p) => p.id === slotId);
    if (slotIndex === -1) {
      throw new NotFoundException(`Slot ${slotId} not found in plan ${planId}`);
    }

    planData.posts[slotIndex] = {
      ...planData.posts[slotIndex],
      ...(dto.dayOfWeek !== undefined && { dayOfWeek: dto.dayOfWeek }),
      ...(dto.scheduledTime !== undefined && {
        scheduledTime: dto.scheduledTime,
      }),
      ...(dto.platform !== undefined && { platform: dto.platform }),
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.caption !== undefined && { caption: dto.caption }),
      ...(dto.hashtags !== undefined && { hashtags: dto.hashtags }),
      ...(dto.status !== undefined && { status: dto.status }),
    };

    return this.repo.savePlanData(planId, userId, planData);
  }

  async markPosted(userId: string, planId: string, slotId: string) {
    return this.updateSlot(userId, planId, slotId, { status: 'POSTED' });
  }

  async markSkipped(userId: string, planId: string, slotId: string) {
    return this.updateSlot(userId, planId, slotId, { status: 'SKIPPED' });
  }

  /**
   * Adds a manually-created post slot to an existing plan.
   * Used when the user clicks "Add post" in the UI.
   */
  async addSlot(
    userId: string,
    planId: string,
    payload: Omit<ScheduledPost, 'id' | 'status' | 'aiRationale'>,
  ) {
    const plan = await this.repo.getPlanById(planId, userId);
    const planData = plan.plan as unknown as WeeklyPlanData;

    const newSlot: ScheduledPost = {
      ...payload,
      id: uuidv4(),
      status: 'SCHEDULED',
      aiRationale: 'Manually added by user.',
    };

    planData.posts.push(newSlot);
    return this.repo.savePlanData(planId, userId, planData);
  }

  /**
   * Removes a slot from a plan (user deletes a card).
   */
  async deleteSlot(userId: string, planId: string, slotId: string) {
    const plan = await this.repo.getPlanById(planId, userId);
    const planData = plan.plan as unknown as WeeklyPlanData;

    const before = planData.posts.length;
    planData.posts = planData.posts.filter((p) => p.id !== slotId);

    if (planData.posts.length === before) {
      throw new NotFoundException(`Slot ${slotId} not found in plan ${planId}`);
    }

    return this.repo.savePlanData(planId, userId, planData);
  }

  // ─── Gemini helpers ───────────────────────────────────────────────────────

  private async callGemini(prompt: string): Promise<string> {
    try {
      const model = this.gemini.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (!text || text.trim().length === 0) {
        throw new InternalServerErrorException(
          'Gemini returned an empty response',
        );
      }
      return text;
    } catch (err) {
      this.logger.error('Gemini API call failed', err);
      throw new InternalServerErrorException(
        'AI generation failed. Please try again.',
      );
    }
  }

  /**
   * Parses and validates the raw JSON string from Gemini.
   * Falls back to a safe empty structure on parse failure so callers never crash.
   */
  private parsePlanResponse(raw: string, weekStart: Date): WeeklyPlanData {
    let parsed: any;

    try {
      // Strip any accidental markdown fences Gemini may include
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      // Detect truncated JSON before attempting parse
      if (!cleaned.endsWith('}')) {
        this.logger.error(
          'Gemini response appears truncated',
          `Last 100 chars: ...${cleaned.slice(-100)}`,
        );
        throw new InternalServerErrorException(
          'AI response was cut off. Please regenerate the plan.',
        );
      }

      parsed = JSON.parse(cleaned);
    } catch (err) {
      this.logger.error(
        'Failed to parse Gemini JSON response',
        raw.slice(0, 300),
      );
      throw new InternalServerErrorException(
        'AI returned malformed JSON. Please regenerate the plan.',
      );
    }

    // Validate minimal shape
    if (!Array.isArray(parsed.posts) || !Array.isArray(parsed.reminders)) {
      throw new InternalServerErrorException(
        'AI response missing required fields (posts / reminders).',
      );
    }

    // Guarantee every post has a UUID (model sometimes omits it)
    const posts: ScheduledPost[] = parsed.posts.map((p: any) => ({
      ...p,
      id: p.id ?? uuidv4(),
      status: p.status ?? 'SCHEDULED',
      hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
      contentIdeaId: p.contentIdeaId ?? null,
      generatedPostId: p.generatedPostId ?? null,
    }));

    const reminders: PlanReminder[] = parsed.reminders.map((r: any) => ({
      ...r,
      id: r.id ?? uuidv4(),
    }));

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      summary: parsed.summary ?? '',
      posts,
      reminders,
      unscheduledIdeaIds: Array.isArray(parsed.unscheduledIdeaIds)
        ? parsed.unscheduledIdeaIds
        : [],
    };
  }
}
