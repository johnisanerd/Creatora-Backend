import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ChatDto {
  @ApiProperty({
        example: '6d55dc1f-4b63-4c5e-a7af-cd8dc02d4fd0',
        description: 'Conversation ID',
    })
    @IsUUID()
    conversationId!: string;

  @ApiProperty({
        example: 'How does Weekly Planner work?',
    })
    @IsString()
    @IsNotEmpty()
    question!: string;
}