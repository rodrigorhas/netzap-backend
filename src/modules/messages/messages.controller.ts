import { Controller, Get, Post, Patch, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { ChatMessage, ChatGroup } from '../whatsapp/types';

@ApiTags('Messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Buscar mensagens ou grupos de chat' })
  @ApiQuery({ name: 'chatId', required: false, description: 'ID do chat para buscar mensagens' })
  @ApiResponse({ status: 200, description: 'Mensagens ou grupos de chat retornados com sucesso' })
  async getMessages(
    @Query('chatId') chatId?: string
  ): Promise<ChatMessage[] | ChatGroup[]> {
    if (chatId) {
      return this.messagesService.getChatMessages(chatId);
    }
    return this.messagesService.getChatGroups();
  }

  @Post()
  @ApiOperation({ summary: 'Enviar mensagem' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Número de telefone do destinatário' },
        message: { type: 'string', description: 'Mensagem a ser enviada' }
      },
      required: ['to', 'message']
    }
  })
  @ApiResponse({ status: 201, description: 'Mensagem enviada com sucesso' })
  async sendMessage(@Body() body: { to: string; message: string }) {
    return this.messagesService.sendMessage(body.to, body.message);
  }

  @Patch()
  @ApiOperation({ summary: 'Marcar chat como lido' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        chatId: { type: 'string', description: 'ID do chat' }
      },
      required: ['chatId']
    }
  })
  @ApiResponse({ status: 200, description: 'Chat marcado como lido' })
  async markChatAsRead(@Body() body: { chatId: string }) {
    return this.messagesService.markChatAsRead(body.chatId);
  }
}
