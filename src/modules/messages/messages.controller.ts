import { Controller, Get, Post, Patch, Query, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { ChatMessage, ChatGroup } from '../whatsapp/types';
import { SendMessageDto } from './dto/send-message.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';

@ApiTags('Messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Buscar mensagens ou grupos de chat' })
  @ApiQuery({ name: 'chatId', required: false, description: 'ID do chat para buscar mensagens' })
  @ApiQuery({ name: 'lastMessageId', required: false, description: 'ID da última mensagem para verificar atualizações' })
  @ApiResponse({ status: 200, description: 'Dados retornados com sucesso' })
  async getMessages(
    @Query('chatId') chatId?: string,
    @Query('lastMessageId') lastMessageId?: string
  ) {
    try {
      if (chatId) {
        const messages = this.messagesService.getChatMessages(chatId);
        
        return {
          success: true,
          data: {
            messages,
            count: messages.length,
            chatId,
            type: 'chat_messages'
          }
        };
      }
      
      const chatGroups = this.messagesService.getChatGroups();
      const currentLastMessageId = this.messagesService.getLastMessageId();
      
      const hasNewMessages = lastMessageId !== currentLastMessageId;
      
      return {
        success: true,
        data: {
          chatGroups,
          count: chatGroups.length,
          lastMessageId: currentLastMessageId,
          hasNewMessages,
          type: 'chat_groups'
        }
      };
    } catch (error) {
      throw new HttpException(
        { 
          success: false, 
          error: 'Erro ao buscar mensagens',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Enviar mensagem' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ status: 200, description: 'Mensagem enviada com sucesso' })
  async sendMessage(@Body() body: SendMessageDto) {
    try {
      const { to, message, markAsRead } = body;
      
      if (!to || !message) {
        throw new HttpException(
          { success: false, error: 'Destinatário e mensagem são obrigatórios' },
          HttpStatus.BAD_REQUEST
        );
      }
      
      const sentMessage = await this.messagesService.sendMessage(to, message);
      
      // Se solicitado, marcar chat como lido
      if (markAsRead && to) {
        this.messagesService.markChatAsRead(to);
      }
      
      return {
        success: true,
        message: 'Mensagem enviada com sucesso',
        messageId: sentMessage.id?._serialized || 'unknown'
      };
    } catch (error) {
      throw new HttpException(
        { 
          success: false, 
          error: 'Erro ao enviar mensagem',
          details: error instanceof Error ? error.message : 'Erro desconhecido' 
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch()
  @ApiOperation({ summary: 'Marcar chat como lido' })
  @ApiBody({ type: MarkAsReadDto })
  @ApiResponse({ status: 200, description: 'Chat marcado como lido' })
  async markChatAsRead(@Body() body: MarkAsReadDto) {
    try {
      const { chatId } = body;
      
      if (!chatId) {
        throw new HttpException(
          { success: false, error: 'chatId é obrigatório' },
          HttpStatus.BAD_REQUEST
        );
      }
      
      this.messagesService.markChatAsRead(chatId);
      
      return {
        success: true,
        message: 'Chat marcado como lido'
      };
    } catch (error) {
      throw new HttpException(
        { 
          success: false, 
          error: 'Erro ao marcar chat como lido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
