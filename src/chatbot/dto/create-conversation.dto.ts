import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @ApiPropertyOptional({
    example: 'Content Planning',
    description: 'Optional conversation title',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;
}