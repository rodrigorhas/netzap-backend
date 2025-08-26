import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { InitializeDto } from './dto/initialize.dto';

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
      
      // Verificar se há informações de loading disponíveis
      let loadingPercent, loadingMessage;
      if (isInitializing && !isReady) {
        // Simular progresso de loading baseado no tempo de inicialização
        const startTime = Date.now();
        const elapsed = Date.now() - startTime;
        loadingPercent = Math.min(Math.floor(elapsed / 100), 95); // Máximo 95% até estar pronto
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
          console.log('Inicializando WhatsApp via API...');
          
          // Verificar se já está inicializando
          if (this.whatsappService.getIsInitializing()) {
            return { 
              success: true, 
              message: 'WhatsApp já está sendo inicializado' 
            };
          }
          
          // Verificar se já está pronto
          if (this.whatsappService.isClientReady()) {
            return { 
              success: true, 
              message: 'WhatsApp já está conectado' 
            };
          }
          
          try {
            await this.whatsappService.initialize();
            return { 
              success: true, 
              message: 'WhatsApp inicializado com sucesso' 
            };
          } catch (initError) {
            console.error('Erro na inicialização:', initError);
            throw new HttpException({ 
              success: false, 
              error: initError instanceof Error ? initError.message : 'Erro na inicialização' 
            }, HttpStatus.INTERNAL_SERVER_ERROR);
          }
        
        case 'logout':
          console.log('Desconectando WhatsApp via API...');
          try {
            await this.whatsappService.logout();
            return { 
              success: true, 
              message: 'WhatsApp desconectado com sucesso' 
            };
          } catch (logoutError) {
            console.error('Erro no logout:', logoutError);
            throw new HttpException({ 
              success: false, 
              error: logoutError instanceof Error ? logoutError.message : 'Erro no logout' 
            }, HttpStatus.INTERNAL_SERVER_ERROR);
          }
        
        default:
          throw new HttpException(
            { success: false, error: 'Ação inválida' },
            HttpStatus.BAD_REQUEST
          );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
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
