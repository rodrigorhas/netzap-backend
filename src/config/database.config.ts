import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { MessageEntity } from '../modules/whatsapp/entities/message.entity';
import { ChatEntity } from '../modules/whatsapp/entities/chat.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'netzap_db',
  entities: [MessageEntity, ChatEntity],
  synchronize: false, // Desabilitar sincronização automática
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};
