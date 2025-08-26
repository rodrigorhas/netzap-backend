import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';

class InitializeDto {
  action: 'initialize' | 'logout';
}

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get()
  @ApiOperation({ summary: 'Verificar status do WhatsApp' })
  @ApiResponse({ status: 200, description: 'Status do WhatsApp retornado com sucesso' })
  async getStatus() {
    try {
      const isReady = this.whatsappService.isClientReady();
      const isInitializing = this.whatsappService.getIsInitializing();
      const qrCode = this.whatsappService.getQRCode();
      
      let loadingPercent, loadingMessage;
      if (isInitializing && !isReady) {
        const startTime = Date.now();
        const elapsed = Date.now() - startTime;
        loadingPercent = Math.min(Math.floor(elapsed / 100), 95);
        loadingMessage = 'Conectando ao WhatsApp...';
      }
      
      return {
        success: true,
        isReady,
        isInitializing,
        qrCode,
        loadingPercent,
        loadingMessage,
        message: isReady ? 'WhatsApp conectado' : isInitializing ? 'Inicializando...' : 'Aguardando inicialização'
      };
    } catch (error) {
      throw new HttpException(
        { success: false, error: 'Erro ao verificar status do WhatsApp' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Inicializar ou desconectar WhatsApp' })
  @ApiBody({ type: InitializeDto })
  @ApiResponse({ status: 200, description: 'Ação executada com sucesso' })
  async executeAction(@Body() body: InitializeDto) {
    try {
      const { action } = body;
      
      switch (action) {
        case 'initialize':
          if (this.whatsappService.getIsInitializing()) {
            return { 
              success: true, 
              message: 'WhatsApp já está sendo inicializado' 
            };
          }
          
          if (this.whatsappService.isClientReady()) {
            return { 
              success: true, 
              message: 'WhatsApp já está conectado' 
            };
          }
          
          await this.whatsappService.initialize();
          return { 
            success: true, 
            message: 'WhatsApp inicializado com sucesso' 
          };
        
        case 'logout':
          await this.whatsappService.logout();
          return { 
            success: true, 
            message: 'WhatsApp desconectado com sucesso' 
          };
        
        default:
          throw new HttpException(
            { success: false, error: 'Ação inválida' },
            HttpStatus.BAD_REQUEST
          );
      }
    } catch (error) {
      throw new HttpException(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Erro interno do servidor' 
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
