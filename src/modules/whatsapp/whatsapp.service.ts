import { Injectable, Logger } from '@nestjs/common';
import { Chat, Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import { EventEmitter } from 'events';
import { ChatMessage, ChatGroup } from './types';

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

  constructor() {
    super();
    
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'netzap-client',
        dataPath: './.wwebjs_auth'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ],
        timeout: 60000
      },
      webVersion: '2.2402.5',
      webVersionCache: {
        type: 'local'
      }
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

    this.client.on('authenticated', () => {
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
      
      await this.updateChatGroups();
      this.emit('message', message);
    });

    this.client.on('message_create', async (message) => {
      if (message.fromMe) {
        this.logger.log(`Mensagem enviada para ${message.to}: ${message.body}`);
        this.messages.push(message);
        this.lastMessageId = message.id._serialized;
        
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

  getMessages(): Message[] {
    return this.messages;
  }

  getChatGroups(): ChatGroup[] {
    return Array.from(this.chatGroups.values())
      .sort((a, b) => {
        // Ordenar por última mensagem (mais recentes primeiro)
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return b.lastMessage.timestamp - a.lastMessage.timestamp;
      });
  }

  getChatMessages(chatId: string): ChatMessage[] {
    const group = this.chatGroups.get(chatId);
    return group ? group.messages : [];
  }

  getLastMessageId(): string | null {
    return this.lastMessageId;
  }

  async getMessageMedia(messageId: string): Promise<any> {
    try {
      const message = this.messages.find(msg => msg.id._serialized === messageId);
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
        }
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
    return await this.client.sendMessage(to, message);
  }

  markChatAsRead(chatId: string): void {
    const chatGroup = this.chatGroups.get(chatId);
    if (chatGroup) {
      chatGroup.unreadCount = 0;
    }
  }

  private async loadExistingMessages(): Promise<void> {
    try {
      const chats = await this.client.getChats();
      for (const chat of chats) {
        const messages = await chat.fetchMessages({ limit: 5 });
        this.messages.push(...messages);
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
        const chatMessages = this.messages.filter(msg => 
          msg.from === chat.id._serialized || msg.to === chat.id._serialized
        );

        const lastMessage = chatMessages.length > 0 
          ? this.convertToChatMessage(chatMessages[chatMessages.length - 1])
          : null;

        this.chatGroups.set(chat.id._serialized, {
          chatId: chat.id._serialized,
          chatName: chat.name || chat.id.user,
          isGroup: chat.isGroup,
          messages: chatMessages.map(msg => this.convertToChatMessage(msg)),
          lastMessage,
          unreadCount: chat.unreadCount
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
