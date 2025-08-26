import { IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitializeDto {
  @ApiProperty({
    description: 'Ação a ser executada',
    enum: ['initialize', 'logout'],
    example: 'initialize'
  })
  @IsNotEmpty({ message: 'Ação é obrigatória' })
  @IsIn(['initialize', 'logout'], { message: 'Ação deve ser "initialize" ou "logout"' })
  action: 'initialize' | 'logout';
}
