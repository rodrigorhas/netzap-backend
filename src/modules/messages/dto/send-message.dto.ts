import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Número de telefone do destinatário',
    example: '5511999999999@c.us'
  })
  @IsNotEmpty({ message: 'Destinatário é obrigatório' })
  @IsString({ message: 'Destinatário deve ser uma string' })
  to: string;

  @ApiProperty({
    description: 'Mensagem a ser enviada',
    example: 'Olá! Como você está?'
  })
  @IsNotEmpty({ message: 'Mensagem é obrigatória' })
  @IsString({ message: 'Mensagem deve ser uma string' })
  message: string;

  @ApiProperty({
    description: 'Marcar chat como lido após enviar mensagem',
    example: false,
    required: false
  })
  @IsOptional()
  @IsBoolean({ message: 'markAsRead deve ser um booleano' })
  markAsRead?: boolean;
}
