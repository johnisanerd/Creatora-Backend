import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class GeneratePlanDto {
  @ApiPropertyOptional({
    example: '2026-05-19',
    description:
      'Start date of the week in YYYY-MM-DD format. Defaults to current week Monday if omitted.',
  })
  @IsOptional()
  @IsDateString()
  weekStart?: string;
}