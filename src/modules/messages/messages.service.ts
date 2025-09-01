import { Injectable } from '@nestjs/common';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ChatMessage, ChatGroup } from '../whatsapp/types';

@Injectable()
export class MessagesService {
  constructor(private readonly whatsappService: WhatsappService) {}

  async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    return this.whatsappService.getChatMessages(chatId);
  }

  async getChatGroups(): Promise<ChatGroup[]> {
    return this.whatsappService.getChatGroups();
  }

  async getLastMessageId(): Promise<string | null> {
    return this.whatsappService.getLastMessageId();
  }

  async sendMessage(to: string, message: string) {
    return this.whatsappService.sendMessage(to, message);
  }

  async markChatAsRead(chatId: string): Promise<void> {
    await this.whatsappService.markChatAsRead(chatId);
  }
}
