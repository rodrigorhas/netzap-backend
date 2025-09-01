import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('messages')
@Index(['chatId', 'timestamp'])
@Index(['from', 'timestamp'])
@Index(['to', 'timestamp'])
export class MessageEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column('text')
  body: string;

  @Column('bigint')
  timestamp: number;

  @Column()
  type: string;

  @Column({ name: 'is_from_me' })
  isFromMe: boolean;

  @Column({ name: 'chat_id' })
  chatId: string;

  @Column({ name: 'chat_name' })
  chatName: string;

  @Column({ name: 'is_group' })
  isGroup: boolean;

  @Column({ name: 'has_media' })
  hasMedia: boolean;

  @Column('jsonb', { nullable: true })
  media?: {
    mimetype: string;
    data: string; // base64
    filename?: string;
    filesize?: number;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
