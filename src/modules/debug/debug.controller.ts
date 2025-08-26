import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DebugService } from './debug.service';

@ApiTags('Debug')
@Controller('debug')
export class DebugController {
  constructor(private readonly debugService: DebugService) {}

  @Get()
  @ApiOperation({ summary: 'Obter informações de debug' })
  @ApiResponse({ status: 200, description: 'Informações de debug retornadas com sucesso' })
  async getDebugInfo() {
    try {
      console.log('=== DEBUG INFO ===');
      
      const debugInfo = this.debugService.getDebugInfo();
      
      console.log('Status do cliente:', { 
        isReady: debugInfo.client.isReady, 
        isInitializing: debugInfo.client.isInitializing 
      });
      console.log('Total de mensagens:', debugInfo.messages.total);
      console.log('Total de grupos de chat:', debugInfo.chatGroups.total);
      console.log('Last message ID:', debugInfo.messages.lastMessageId);
      
      // Detalhes dos grupos de chat
      debugInfo.chatGroups.groups.forEach((group, index) => {
        console.log(`Grupo ${index + 1}:`, {
          chatId: group.chatId,
          chatName: group.chatName,
          messageCount: group.messageCount,
          unreadCount: group.unreadCount,
          lastMessage: group.lastMessage
        });
      });
      
      console.log('Últimas 5 mensagens:', debugInfo.messages.lastMessages);
      console.log('=== FIM DEBUG ===');
      
      return {
        success: true,
        ...debugInfo
      };
    } catch (error) {
      throw new HttpException(
        { 
          success: false, 
          error: 'Erro ao obter informações de debug',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
