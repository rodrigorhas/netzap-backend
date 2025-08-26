import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkAsReadDto {
  @ApiProperty({
    description: 'ID do chat',
    example: '5511999999999@c.us'
  })
  @IsNotEmpty({ message: 'ID do chat é obrigatório' })
  @IsString({ message: 'ID do chat deve ser uma string' })
  chatId: string;
}
