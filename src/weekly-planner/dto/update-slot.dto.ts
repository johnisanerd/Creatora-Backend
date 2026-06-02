import { ApiPropertyOptional } from '@nestjs/swagger';
import { SocialPlatform } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  IsInt,
  IsArray,
} from 'class-validator';
import { PostStatus } from '../weekly-plan.interface';

export class UpdateSlotDto {
  @ApiPropertyOptional({
    example: 1,
    minimum: 0,
    maximum: 6,
    description: 'Day of week (0 = Sunday, 6 = Saturday)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;

  @ApiPropertyOptional({
    example: '09:30',
    description: 'Scheduled time in HH:MM (24-hour) format',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'scheduledTime must be in HH:MM format',
  })
  scheduledTime?: string;

  @ApiPropertyOptional({
    enum: SocialPlatform,
    example: SocialPlatform.INSTAGRAM,
    description: 'Target social media platform',
  })
  @IsOptional()
  @IsString()
  platform?: SocialPlatform;

  @ApiPropertyOptional({
    example: '5 Productivity Hacks for Entrepreneurs',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example:
      'These simple productivity hacks can help you get more done in less time.',
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['#productivity', '#entrepreneur', '#business'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({
    enum: ['SCHEDULED', 'POSTED', 'SKIPPED'],
    example: 'POSTED',
    description: 'Current publishing status',
  })
  @IsOptional()
  @IsEnum(['SCHEDULED', 'POSTED', 'SKIPPED'] as const)
  status?: PostStatus;
}