import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageEntity } from '../entities/message.entity';
import { ChatEntity } from '../entities/chat.entity';
import { ChatMessage, ChatGroup } from '../types';

@Injectable()
export class MessageDatabaseService {
  private readonly logger = new Logger(MessageDatabaseService.name);

  constructor(
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
    @InjectRepository(ChatEntity)
    private chatRepository: Repository<ChatEntity>,
  ) {}

  async saveMessage(message: ChatMessage): Promise<void> {
    try {
      const messageEntity = this.messageRepository.create({
        id: message.id,
        from: message.from,
        to: message.to,
        body: message.body,
        timestamp: message.timestamp,
        type: message.type,
        isFromMe: message.isFromMe,
        chatId: message.chatId,
        chatName: message.chatName,
        isGroup: message.isGroup,
        hasMedia: message.hasMedia,
        media: message.media,
      });

      await this.messageRepository.save(messageEntity);
      await this.updateChatLastMessage(message);
      
      this.logger.log(`Mensagem salva no banco: ${message.id}`);
    } catch (error) {
      this.logger.error('Erro ao salvar mensagem no banco:', error);
      throw error;
    }
  }

  async saveChat(chat: ChatGroup): Promise<void> {
    try {
      const chatEntity = this.chatRepository.create({
        chatId: chat.chatId,
        chatName: chat.chatName,
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        lastMessageId: chat.lastMessage?.id || null,
        lastMessageTimestamp: chat.lastMessage?.timestamp || null,
        lastMessageBody: chat.lastMessage?.body || null,
        lastMessageFrom: chat.lastMessage?.from || null,
      });

      await this.chatRepository.save(chatEntity);
      this.logger.log(`Chat salvo no banco: ${chat.chatId}`);
    } catch (error) {
      this.logger.error('Erro ao salvar chat no banco:', error);
      throw error;
    }
  }

  async getMessages(limit: number = 100, offset: number = 0): Promise<ChatMessage[]> {
    try {
      const messages = await this.messageRepository.find({
        order: { timestamp: 'DESC' },
        skip: offset,
        take: limit,
      });

      return messages.map(msg => ({
        id: msg.id,
        from: msg.from,
        to: msg.to,
        body: msg.body,
        timestamp: msg.timestamp,
        type: msg.type,
        isFromMe: msg.isFromMe,
        chatId: msg.chatId,
        chatName: msg.chatName,
        isGroup: msg.isGroup,
        hasMedia: msg.hasMedia,
        media: msg.media,
      }));
    } catch (error) {
      this.logger.error('Erro ao buscar mensagens do banco:', error);
      throw error;
    }
  }

  async getChatMessages(chatId: string, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    try {
      const messages = await this.messageRepository.find({
        where: { chatId },
        order: { timestamp: 'DESC' },
        skip: offset,
        take: limit,
      });

      return messages.map(msg => ({
        id: msg.id,
        from: msg.from,
        to: msg.to,
        body: msg.body,
        timestamp: msg.timestamp,
        type: msg.type,
        isFromMe: msg.isFromMe,
        chatId: msg.chatId,
        chatName: msg.chatName,
        isGroup: msg.isGroup,
        hasMedia: msg.hasMedia,
        media: msg.media,
      }));
    } catch (error) {
      this.logger.error('Erro ao buscar mensagens do chat no banco:', error);
      throw error;
    }
  }

  async getChats(): Promise<ChatGroup[]> {
    try {
      const chats = await this.chatRepository.find({
        order: { lastMessageTimestamp: 'DESC' },
      });

      return chats.map(chat => ({
        chatId: chat.chatId,
        chatName: chat.chatName,
        isGroup: chat.isGroup,
        messages: [], // Será carregado separadamente se necessário
        lastMessage: chat.lastMessageId ? {
          id: chat.lastMessageId,
          from: chat.lastMessageFrom,
          to: '',
          body: chat.lastMessageBody,
          timestamp: chat.lastMessageTimestamp,
          type: 'text',
          isFromMe: false,
          chatId: chat.chatId,
          chatName: chat.chatName,
          isGroup: chat.isGroup,
          hasMedia: false,
        } : null,
        unreadCount: chat.unreadCount,
      }));
    } catch (error) {
      this.logger.error('Erro ao buscar chats do banco:', error);
      throw error;
    }
  }

  async getMessageById(messageId: string): Promise<ChatMessage | null> {
    try {
      const message = await this.messageRepository.findOne({
        where: { id: messageId },
      });

      if (!message) return null;

      return {
        id: message.id,
        from: message.from,
        to: message.to,
        body: message.body,
        timestamp: message.timestamp,
        type: message.type,
        isFromMe: message.isFromMe,
        chatId: message.chatId,
        chatName: message.chatName,
        isGroup: message.isGroup,
        hasMedia: message.hasMedia,
        media: message.media,
      };
    } catch (error) {
      this.logger.error('Erro ao buscar mensagem por ID no banco:', error);
      throw error;
    }
  }

  async markChatAsRead(chatId: string): Promise<void> {
    try {
      await this.chatRepository.update(
        { chatId },
        { unreadCount: 0 }
      );
      this.logger.log(`Chat marcado como lido: ${chatId}`);
    } catch (error) {
      this.logger.error('Erro ao marcar chat como lido:', error);
      throw error;
    }
  }

  async getLastMessageId(): Promise<string | null> {
    try {
      const lastMessage = await this.messageRepository.findOne({
        where: { },
        order: { timestamp: 'DESC' },
        select: ['id'],
      });

      return lastMessage?.id || null;
    } catch (error) {
      this.logger.error('Erro ao buscar última mensagem ID:', error);
      throw error;
    }
  }

  private async updateChatLastMessage(message: ChatMessage): Promise<void> {
    try {
      const chat = await this.chatRepository.findOne({
        where: { chatId: message.chatId },
      });

      if (chat) {
        // Atualizar chat existente
        await this.chatRepository.update(
          { chatId: message.chatId },
          {
            lastMessageId: message.id,
            lastMessageTimestamp: message.timestamp,
            lastMessageBody: message.body,
            lastMessageFrom: message.from,
            unreadCount: message.isFromMe ? chat.unreadCount : chat.unreadCount + 1,
          }
        );
      } else {
        // Criar novo chat
        await this.saveChat({
          chatId: message.chatId,
          chatName: message.chatName,
          isGroup: message.isGroup,
          messages: [],
          lastMessage: message,
          unreadCount: message.isFromMe ? 0 : 1,
        });
      }
    } catch (error) {
      this.logger.error('Erro ao atualizar última mensagem do chat:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await this.messageRepository.clear();
      await this.chatRepository.clear();
      this.logger.log('Todos os dados foram limpos do banco');
    } catch (error) {
      this.logger.error('Erro ao limpar dados do banco:', error);
      throw error;
    }
  }
}
