import { Injectable, Logger } from '@nestjs/common';
import { Chat, Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import { EventEmitter } from 'events';
import { ChatMessage, ChatGroup } from './types';
import { MessageDatabaseService } from './services/message-database.service';

@Injectable()
export class WhatsappService extends EventEmitter {
  private readonly logger = new Logger(WhatsappService.name);
  private client: Client;
  private qrCode: string | null = null;
  private isReady: boolean = false;
  private isInitializing: boolean = false;
  private messages: Message[] = [];
  private chatGroups: Map<string, ChatGroup> = new Map();
  private lastMessageId: string | null = null;

  constructor(private messageDatabaseService: MessageDatabaseService) {
    super();

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'netzap-client',
      }),
      puppeteer: {
        headless: false,
        timeout: 60000,
      },
      webVersion: '2.2402.5',
      webVersionCache: {
        type: 'local',
      },
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.client.on('qr', async (qr) => {
      try {
        this.logger.log('QR Code recebido, gerando imagem...');
        this.qrCode = await qrcode.toDataURL(qr);
        this.emit('qr', this.qrCode);
        this.logger.log('QR Code gerado com sucesso');
      } catch (error) {
        this.logger.error('Erro ao gerar QR Code:', error);
        this.emit('error', 'Erro ao gerar QR Code');
      }
    });

    this.client.on('ready', async () => {
      this.logger.log('Cliente WhatsApp está pronto!');
      this.isReady = true;
      this.isInitializing = false;
      this.qrCode = null;

      await this.loadExistingMessages();
      this.emit('ready');
    });

    this.client.on('authenticated', async () => {
      this.logger.log('WhatsApp autenticado!');
      this.emit('authenticated');
    });

    this.client.on('auth_failure', (msg) => {
      this.logger.error('Falha na autenticação:', msg);
      this.isReady = false;
      this.isInitializing = false;
      this.emit('auth_failure', msg);
    });

    this.client.on('disconnected', (reason) => {
      this.logger.log('WhatsApp desconectado:', reason);
      this.isReady = false;
      this.qrCode = null;
      this.emit('disconnected', reason);
    });

    this.client.on('message', async (message) => {
      this.logger.log(`Nova mensagem de ${message.from}: ${message.body}`);
      this.messages.push(message);
      this.lastMessageId = message.id._serialized;

      // Salvar mensagem no banco de dados
      const chatMessage = this.convertToChatMessage(message);
      await this.messageDatabaseService.saveMessage(chatMessage);

      await this.updateChatGroups();
      this.emit('message', message);
    });

    this.client.on('message_create', async (message) => {
      if (message.fromMe) {
        this.logger.log(`Mensagem enviada para ${message.to}: ${message.body}`);
        this.messages.push(message);
        this.lastMessageId = message.id._serialized;

        // Salvar mensagem no banco de dados
        const chatMessage = this.convertToChatMessage(message);
        await this.messageDatabaseService.saveMessage(chatMessage);

        await this.updateChatGroups();
        this.emit('message_create', message);
      }
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitializing || this.isReady) {
      return;
    }

    this.isInitializing = true;
    this.logger.log('Inicializando cliente WhatsApp...');

    try {
      await this.client.initialize();
    } catch (error) {
      this.isInitializing = false;
      this.logger.error('Erro na inicialização:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.logger.log('Desconectando WhatsApp...');

    try {
      await this.client.destroy();
    } catch (error) {
      this.logger.error('Erro ao desconectar WhatsApp:', error);
    }

    this.isReady = false;
    this.isInitializing = false;
    this.qrCode = null;
    this.messages = [];
    this.chatGroups.clear();
    this.lastMessageId = null;
  }

  isClientReady(): boolean {
    return this.isReady;
  }

  getIsInitializing(): boolean {
    return this.isInitializing;
  }

  getQRCode(): string | null {
    return this.qrCode;
  }

  async getMessages(): Promise<ChatMessage[]> {
    return this.messageDatabaseService.getMessages();
  }

  async getChatGroups(): Promise<ChatGroup[]> {
    return this.messageDatabaseService.getChats();
  }

  async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    return this.messageDatabaseService.getChatMessages(chatId);
  }

  async getLastMessageId(): Promise<string | null> {
    return this.messageDatabaseService.getLastMessageId();
  }

  async getMessageMedia(messageId: string): Promise<any> {
    try {
      // Primeiro, tentar buscar do banco de dados
      const dbMessage =
        await this.messageDatabaseService.getMessageById(messageId);
      if (dbMessage && dbMessage.media) {
        return {
          success: true,
          data: dbMessage.media,
        };
      }

      // Se não encontrar no banco, buscar da memória (para mensagens antigas)
      const message = this.messages.find(
        (msg) => msg.id._serialized === messageId,
      );
      if (!message) {
        throw new Error('Mensagem não encontrada');
      }

      if (!message.hasMedia || !message.downloadMedia) {
        throw new Error('Mensagem não possui media');
      }

      const media = await message.downloadMedia();
      return {
        success: true,
        data: {
          mimetype: media.mimetype,
          data: media.data,
          filename: media.filename,
          filesize: media.filesize,
        },
      };
    } catch (error) {
      this.logger.error('Erro ao buscar media da mensagem:', error);
      throw error;
    }
  }

  async sendMessage(to: string, message: string): Promise<Message> {
    if (!this.isReady) {
      throw new Error('WhatsApp não está conectado');
    }
    return this.client.sendMessage(to, message);
  }

  async markChatAsRead(chatId: string): Promise<void> {
    await this.messageDatabaseService.markChatAsRead(chatId);
  }

  public async loadExistingMessages(): Promise<void> {
    try {
      // Carregar mensagens do banco de dados
      const dbMessages = await this.messageDatabaseService.getMessages(1000);
      this.messages = dbMessages.map((msg) => {
        // Converter de volta para o formato do whatsapp-web.js se necessário
        return msg as any;
      });

      // Também carregar algumas mensagens recentes do WhatsApp se necessário
      const chats = await this.client.getChats();
      for (const chat of chats) {
        const messages = await chat.fetchMessages({ limit: 5 });
        // Verificar se já existem no banco antes de adicionar
        for (const message of messages) {
          const exists = await this.messageDatabaseService.getMessageById(
            message.id._serialized,
          );
          if (!exists) {
            const chatMessage = this.convertToChatMessage(message);
            await this.messageDatabaseService.saveMessage(chatMessage);
          }
        }
      }
      await this.updateChatGroups();
    } catch (error) {
      this.logger.error('Erro ao carregar mensagens existentes:', error);
    }
  }

  private async updateChatGroups(): Promise<void> {
    try {
      const chats = await this.client.getChats();
      this.chatGroups.clear();

      for (const chat of chats) {
        console.log({chat})
        const chatMessages = this.messages.filter(
          (msg) =>
            msg.from === chat.id._serialized || msg.to === chat.id._serialized,
        );

        const lastMessage =
          chatMessages.length > 0
            ? this.convertToChatMessage(chatMessages[chatMessages.length - 1])
            : null;

        this.chatGroups.set(chat.id._serialized, {
          chatId: chat.id._serialized,
          chatName: chat.name || chat.id.user,
          isGroup: chat.isGroup,
          messages: chatMessages.map((msg) => this.convertToChatMessage(msg)),
          lastMessage,
          unreadCount: chat.unreadCount,
        });
      }
    } catch (error) {
      this.logger.error('Erro ao atualizar grupos de chat:', error);
    }
  }

  private convertToChatMessage(message: Message): ChatMessage {
    return {
      id: message.id._serialized,
      from: message.from,
      to: message.to,
      body: message.body || '',
      timestamp: message.timestamp,
      type: message.type,
      isFromMe: message.fromMe,
      chatId: message.fromMe ? message.to : message.from,
      chatName: message.fromMe ? message.to : message.from,
      isGroup: false,
      hasMedia: message.hasMedia,
    };
  }
}
