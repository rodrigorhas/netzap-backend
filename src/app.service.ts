import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'NetZap API está funcionando! 🚀';
  }
}
