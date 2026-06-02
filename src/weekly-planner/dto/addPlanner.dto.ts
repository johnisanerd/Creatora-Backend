import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class AddPlannerSlotDto {
  @ApiProperty({
    example: 1,
    description: 'Day of week (0 = Sunday, 6 = Saturday)',
  })
  dayOfWeek: number;

  @ApiProperty({
    example: '09:00',
  })
  scheduledTime: string;

  @ApiProperty({
    example: 'Instagram',
  })
  platform: string;

  @ApiProperty({
    example: 'Reel',
  })
  format: string;

  @ApiProperty({
    example: 'Top 5 Productivity Tips',
  })
  title: string;

  @ApiProperty({
    example: 'Boost your productivity with these simple tips...',
  })
  caption: string;

  @ApiProperty({
    required: false,
    type: [String],
    example: ['#productivity', '#business'],
  })
  hashtags?: string[];

  @ApiProperty({
    required: false,
    example: '665e0f8b2c1d4a1234567890',
  })
  contentIdeaId?: string;

  @ApiProperty({
    required: false,
    enum: ['IDEA', 'NEW', 'GENERATED'],
    example: 'NEW',
  })
  sourceType?: 'IDEA' | 'NEW' | 'GENERATED';
}
