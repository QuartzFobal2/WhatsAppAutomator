import { z } from 'zod';

// Message Item Schema
export const messageItemSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'image', 'file', 'audio', 'video']),
  content: z.string(),
  fileName: z.string().optional(),
  filePath: z.string().optional(),
  base64Data: z.string().optional(),
});

// Message Set Schema
export const messageSetSchema = z.object({
  name: z.string().min(1, 'Nome do conjunto é obrigatório').max(100, 'Nome muito longo'),
  messages: z.array(messageItemSchema).min(1, 'Adicione pelo menos uma mensagem'),
});

// Validate messages have content
export const messageSetWithContentSchema = messageSetSchema.refine(
  (data) => {
    return data.messages.every((msg) => {
      if (msg.type === 'text') {
        return msg.content.trim().length > 0;
      }
      return msg.filePath || msg.base64Data;
    });
  },
  {
    message: 'Todas as mensagens devem ter conteúdo',
  }
);

// Contact Filter Schema
export const contactFilterSchema = z.object({
  lastMessageText: z.string().optional(),
  lastMessageSender: z.enum(['any', 'me', 'contact']).optional(),
  lastMessageWithin: z.enum(['1h', '24h', '7d', '30d']).optional(),
  labels: z.array(z.string()).optional(),
});

// Scheduled Message Schema
export const scheduledMessageSchema = z.object({
  contactIds: z.array(z.string()).min(1, 'Selecione pelo menos um contato'),
  messages: z.array(messageItemSchema).min(1, 'Adicione pelo menos uma mensagem'),
  scheduledTime: z.date().refine((date) => date > new Date(), {
    message: 'Data agendada deve ser no futuro',
  }),
});

export type MessageItem = z.infer<typeof messageItemSchema>;
export type MessageSetInput = z.infer<typeof messageSetSchema>;
export type ContactFilter = z.infer<typeof contactFilterSchema>;
export type ScheduledMessageInput = z.infer<typeof scheduledMessageSchema>;
