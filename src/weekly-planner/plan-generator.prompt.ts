import { ContentIdea, BrandProfile, GeneratedPost } from '@prisma/client';
import { addDays, toDateString } from './schedule-optimizer';

interface PlanPromptInput {
  brandProfile: BrandProfile;
  favoriteIdeas: ContentIdea[];
  recentPosts: GeneratedPost[];
  weekStart: Date;
}

/**
 * Builds the Gemini prompt for generating a weekly content plan.
 * Returns a prompt that instructs the model to output ONLY valid JSON.
 */
export function buildPlanPrompt(input: PlanPromptInput): string {
  const { brandProfile, favoriteIdeas, recentPosts, weekStart } = input;
  const weekEnd = addDays(weekStart, 6);

  const postingHints = [
    'Instagram Reels → Tue/Fri 9 AM or 6 PM',
    'Instagram Carousels → Wed/Sun 11 AM',
    'Instagram Stories/Polls → Mon/Thu 6 PM',
    'YouTube → Fri 3 PM',
    'Facebook → Wed/Sat 12 PM or 6 PM',
    'LinkedIn → Tue/Thu 8 AM',
    'Twitter/X → Mon/Wed/Fri 10 AM',
  ];

  const favoriteIdeasBlock =
    favoriteIdeas.length > 0
      ? favoriteIdeas
          .map(
            (idea, i) =>
              `${i + 1}. [IDEA_ID:${idea.id}] "${idea.title}"
   Format: ${idea.format ?? 'Any'}
   Hook: ${idea.hook ?? 'N/A'}
   Description: ${idea.description ?? 'N/A'}
   Platform: ${idea.platform ?? 'Instagram'}
   CTA: ${idea.cta ?? 'N/A'}`,
          )
          .join('\n\n')
      : 'No favorited ideas — generate entirely new posts.';

  const recentPostsBlock =
    recentPosts.length > 0
      ? recentPosts
          .map((p) => `- [${p.platform}] ${String(p.content).slice(0, 100)}…`)
          .join('\n')
      : 'No recent posts.';

  const commonPhrases = Array.isArray(brandProfile.commonPhrases)
    ? (brandProfile.commonPhrases as string[]).join(', ')
    : String(brandProfile.commonPhrases ?? '');

  return `You are an expert social media content strategist.
Your task is to generate a structured weekly content calendar for the brand below.

════════════════════════════════
BRAND PROFILE
════════════════════════════════
Niche: ${brandProfile.niche ?? 'General'}
Audience: ${brandProfile.audience ?? 'General public'}
Tone: ${brandProfile.tone ?? 'PROFESSIONAL'}
Formality score (0=casual, 1=formal): ${brandProfile.formalityScore ?? 0.6}
Emotional tone: ${brandProfile.emotionalTone ?? 'Positive'}
Vocabulary complexity: ${brandProfile.vocabularyComplexity ?? 'simple'}
Storytelling style: ${brandProfile.storytellingStyle ?? 'direct'}
Common phrases to use: ${commonPhrases}
Style summary: ${brandProfile.styleSummary ?? 'Direct, promotional, health-focused.'}

════════════════════════════════
FAVORITED IDEAS — PRIORITISE THESE (schedule as many as possible)
════════════════════════════════
${favoriteIdeasBlock}

════════════════════════════════
RECENT POSTS (DO NOT REPEAT these topics or angles)
════════════════════════════════
${recentPostsBlock}

════════════════════════════════
WEEK
════════════════════════════════
Week starts: ${toDateString(weekStart)} (Monday = dayOfWeek 0)
Week ends:   ${toDateString(weekEnd)}   (Sunday = dayOfWeek 6)

════════════════════════════════
POSTING TIME HINTS
════════════════════════════════
${postingHints.map((h) => `• ${h}`).join('\n')}

════════════════════════════════
RULES
════════════════════════════════
1. Schedule exactly 4–6 posts across the week (spread them, not all on one day).
2. Fit ALL favorited ideas into the schedule if 4–6 slots allow; put any that don't fit in "unscheduledIdeaIds".
3. Fill remaining slots with FRESH posts that match the brand voice — vary formats.
4. Add 2–3 smart reminders (harvest timing, engagement checks, content prep notes).
5. Choose the best platform and posting time for each post using the hints above.
6. Keep captions under 200 words; include 5–8 relevant hashtags per post.
7. Set "sourceType" to "IDEA" when the post comes from a favorited idea, "NEW" otherwise.
8. "aiRationale" must be a single sentence explaining why this day/time was chosen.

════════════════════════════════
OUTPUT — RETURN ONLY VALID JSON, NO MARKDOWN, NO EXTRA TEXT
════════════════════════════════
{
  "summary": "<one sentence describing the week's content strategy>",
  "posts": [
    {
      "id": "<uuid-v4>",
      "dayOfWeek": <0-6>,
      "scheduledTime": "<HH:MM>",
      "platform": "<INSTAGRAM|YOUTUBE|FACEBOOK|TWITTER|LINKEDIN|THREAD|BLOG|EMAIL>",
      "format": "<Reel|Carousel|Talking-head|BTS|Trend hijack|Story/Poll|POV|Behind-the-scenes>",
      "title": "<post title>",
      "caption": "<full caption text>",
      "hashtags": ["<hashtag without #>"],
      "contentIdeaId": "<IDEA_ID from above or null>",
      "generatedPostId": null,
      "sourceType": "<IDEA|NEW>",
      "status": "SCHEDULED",
      "aiRationale": "<one sentence>"
    }
  ],
  "reminders": [
    {
      "id": "<uuid-v4>",
      "dayOfWeek": <0-6>,
      "scheduledTime": "<HH:MM>",
      "title": "<short title>",
      "description": "<actionable description>",
      "type": "<HARVEST|ENGAGEMENT_CHECK|CONTENT_PREP|GENERAL>"
    }
  ],
  "unscheduledIdeaIds": ["<IDEA_ID that did not fit this week>"]
}`;
}