import { Injectable } from '@nestjs/common';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ChatMessage, ChatGroup } from '../whatsapp/types';

@Injectable()
export class MessagesService {
  constructor(private readonly whatsappService: WhatsappService) {}

  getChatMessages(chatId: string): ChatMessage[] {
    return this.whatsappService.getChatMessages(chatId);
  }

  getChatGroups(): ChatGroup[] {
    return this.whatsappService.getChatGroups();
  }

  getLastMessageId(): string | null {
    return this.whatsappService.getLastMessageId();
  }

  async sendMessage(to: string, message: string) {
    return await this.whatsappService.sendMessage(to, message);
  }

  markChatAsRead(chatId: string): void {
    this.whatsappService.markChatAsRead(chatId);
  }
}
