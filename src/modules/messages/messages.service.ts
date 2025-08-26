import { Injectable, Logger } from '@nestjs/common';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  getChatMessages(chatId: string) {
    return this.whatsappService.getChatMessages(chatId);
  }

  getChatGroups() {
    return this.whatsappService.getChatGroups();
  }

  getLastMessageId() {
    return this.whatsappService.getLastMessageId();
  }

  async sendMessage(to: string, message: string) {
    this.logger.log(`Enviando mensagem para: ${to}`);
    const sentMessage = await this.whatsappService.sendMessage(to, message);
    this.logger.log('Mensagem enviada com sucesso:', sentMessage.id?._serialized);
    return sentMessage;
  }

  markChatAsRead(chatId: string) {
    this.whatsappService.markChatAsRead(chatId);
  }
}
