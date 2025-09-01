import { Injectable, Logger } from '@nestjs/common';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class DebugService {
  private readonly logger = new Logger(DebugService.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  async getDebugInfo() {
    this.logger.log('=== DEBUG INFO ===');
    
    const isReady = this.whatsappService.isClientReady();
    const isInitializing = this.whatsappService.getIsInitializing();
    const messages = await this.whatsappService.getMessages();
    const chatGroups = await this.whatsappService.getChatGroups();
    const lastMessageId = await this.whatsappService.getLastMessageId();
    
    this.logger.log('Status do cliente:', { isReady, isInitializing });
    this.logger.log('Total de mensagens:', messages.length);
    this.logger.log('Total de grupos de chat:', chatGroups.length);
    this.logger.log('Last message ID:', lastMessageId);
    
    // Detalhes dos grupos de chat
    chatGroups.forEach((group, index) => {
      this.logger.log(`Grupo ${index + 1}:`, {
        chatId: group.chatId,
        chatName: group.chatName,
        messageCount: group.messages.length,
        unreadCount: group.unreadCount,
        lastMessage: group.lastMessage ? {
          id: group.lastMessage.id,
          body: group.lastMessage.body,
          timestamp: group.lastMessage.timestamp,
          isFromMe: group.lastMessage.isFromMe
        } : null
      });
    });
    
    // Últimas 5 mensagens
    const lastMessages = messages.slice(-5).map(msg => ({
      id: msg.id,
      from: msg.from,
      body: msg.body?.substring(0, 50),
      timestamp: msg.timestamp,
      type: msg.type
    }));
    
    this.logger.log('Últimas 5 mensagens:', lastMessages);
    this.logger.log('=== FIM DEBUG ===');
    
    return {
      client: {
        isReady,
        isInitializing
      },
      messages: {
        total: messages.length,
        lastMessageId,
        lastMessages
      },
      chatGroups: {
        total: chatGroups.length,
        groups: chatGroups.map(group => ({
          chatId: group.chatId,
          chatName: group.chatName,
          messageCount: group.messages.length,
          unreadCount: group.unreadCount,
          lastMessage: group.lastMessage ? {
            id: group.lastMessage.id,
            body: group.lastMessage.body,
            timestamp: group.lastMessage.timestamp,
            isFromMe: group.lastMessage.isFromMe
          } : null
        }))
      }
    };
  }
}
