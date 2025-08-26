export interface ChatMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  type: string;
  isFromMe: boolean;
  chatId: string;
  chatName: string;
  isGroup: boolean;
  media?: {
    mimetype: string;
    data: string; // base64
    filename?: string;
    filesize?: number;
  };
  hasMedia: boolean;
}

export interface ChatGroup {
  chatId: string;
  chatName: string;
  isGroup: boolean;
  messages: ChatMessage[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
}
