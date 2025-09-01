import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('chats')
@Index(['lastMessageTimestamp'])
export class ChatEntity {
  @PrimaryColumn({ name: 'chat_id' })
  chatId: string;

  @Column({ name: 'chat_name' })
  chatName: string;

  @Column({ name: 'is_group' })
  isGroup: boolean;

  @Column({ name: 'unread_count', default: 0 })
  unreadCount: number;

  @Column({ name: 'last_message_id', nullable: true })
  lastMessageId: string;

  @Column({ name: 'last_message_timestamp', type: 'bigint', nullable: true })
  lastMessageTimestamp: number;

  @Column({ name: 'last_message_body', type: 'text', nullable: true })
  lastMessageBody: string;

  @Column({ name: 'last_message_from', nullable: true })
  lastMessageFrom: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
