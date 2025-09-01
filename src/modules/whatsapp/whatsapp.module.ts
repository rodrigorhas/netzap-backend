import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { MessageDatabaseService } from './services/message-database.service';
import { MessageEntity } from './entities/message.entity';
import { ChatEntity } from './entities/chat.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageEntity, ChatEntity]),
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService, MessageDatabaseService],
  exports: [WhatsappService, MessageDatabaseService],
})
export class WhatsappModule {}
