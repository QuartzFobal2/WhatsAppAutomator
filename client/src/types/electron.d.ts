export interface WhatsAppAPI {
  getStatus: () => Promise<{ isReady: boolean; qrCode: string | null }>;
  getContacts: () => Promise<Contact[]>;
  getChatHistory: (contactId: string) => Promise<Message[]>;
  sendMessage: (contactId: string, message: string) => Promise<{ success: boolean }>;
  sendMessages: (contactIds: string[], messages: MessageItem[]) => Promise<Array<{ contactId: string; success: boolean; error?: string }>>;
  scheduleMessages: (contactIds: string[], messages: MessageItem[], scheduledTime: string) => Promise<{ success: boolean; scheduledId?: string }>;
  getScheduledMessages: () => Promise<any[]>;
  cancelScheduled: (scheduledId: string) => Promise<{ success: boolean; error?: string }>;
  retryScheduled: (scheduledId: string) => Promise<{ success: boolean; error?: string }>;
  clearScheduledHistory: () => Promise<{ success: boolean }>;
  filterContacts: (criteria: FilterCriteria) => Promise<Contact[]>;
  
  onQRCode: (callback: (qr: string) => void) => () => void;
  onReady: (callback: () => void) => () => void;
  onAuthenticated: (callback: () => void) => () => void;
  onAuthFailure: (callback: (msg: string) => void) => () => void;
  onDisconnected: (callback: (reason: string) => void) => () => void;
  onScheduledSent: (callback: (scheduledId: string, stats: { total: number; successful: number; failed: number }) => void) => () => void;
  onScheduledPartial: (callback: (scheduledId: string, stats: { total: number; successful: number; failed: number; errors: string[] }) => void) => () => void;
  onScheduledFailed: (callback: (scheduledId: string, stats: { total: number; successful: number; failed: number; errors: string[] }) => void) => () => void;
}

declare global {
  interface Window {
    whatsapp?: WhatsAppAPI;
  }
}

export type Contact = {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  labels: string[];
  isFromMe: boolean;
};

export type Message = {
  id: string;
  text: string;
  timestamp: Date;
  isFromMe: boolean;
  mediaType?: 'image' | 'audio' | 'video' | 'document';
};

export type MessageItem = {
  id: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  content: string;
  fileName?: string;
  filePath?: string;
  base64Data?: string;
};

export type FilterCriteria = {
  lastMessageText?: string;
  lastMessageSender?: 'me' | 'contact' | 'any';
  lastMessageWithin?: string;
  labels?: string[];
};
