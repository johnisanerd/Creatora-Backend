import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RenameConversationDto {
  @ApiProperty({
        example: 'Instagram Growth Strategy',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    title!: string;
}