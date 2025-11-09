import { useState, useEffect, useCallback } from 'react';
import type { Contact, Message, MessageItem, FilterCriteria } from '@/types/electron';

export function useWhatsApp() {
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if running in Electron
    if (!window.whatsapp) {
      console.warn('Not running in Electron environment');
      setIsLoading(false);
      return;
    }

    // Get initial status
    window.whatsapp.getStatus().then((status) => {
      setIsConnected(status.isReady);
      setQrCode(status.qrCode);
      setIsLoading(false);
    });

    // Set up event listeners
    const unsubQR = window.whatsapp.onQRCode((qr) => {
      setQrCode(qr);
      setIsConnected(false);
    });

    const unsubReady = window.whatsapp.onReady(() => {
      setIsConnected(true);
      setQrCode(null);
    });

    const unsubDisconnected = window.whatsapp.onDisconnected(() => {
      setIsConnected(false);
    });

    return () => {
      unsubQR();
      unsubReady();
      unsubDisconnected();
    };
  }, []);

  const getContacts = useCallback(async (): Promise<Contact[]> => {
    if (!window.whatsapp) return [];
    try {
      return await window.whatsapp.getContacts();
    } catch (error) {
      console.error('Error getting contacts:', error);
      return [];
    }
  }, []);

  const getChatHistory = useCallback(async (contactId: string): Promise<Message[]> => {
    if (!window.whatsapp) return [];
    try {
      return await window.whatsapp.getChatHistory(contactId);
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }, []);

  const sendMessage = useCallback(async (contactId: string, message: string): Promise<boolean> => {
    if (!window.whatsapp) return false;
    try {
      const result = await window.whatsapp.sendMessage(contactId, message);
      return result.success;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, []);

  const sendMessages = useCallback(async (contactIds: string[], messages: MessageItem[]) => {
    if (!window.whatsapp) return [];
    try {
      return await window.whatsapp.sendMessages(contactIds, messages);
    } catch (error) {
      console.error('Error sending messages:', error);
      return [];
    }
  }, []);

  const filterContacts = useCallback(async (criteria: FilterCriteria): Promise<Contact[]> => {
    if (!window.whatsapp) return [];
    try {
      return await window.whatsapp.filterContacts(criteria);
    } catch (error) {
      console.error('Error filtering contacts:', error);
      return [];
    }
  }, []);

  const scheduleMessages = useCallback(async (contactIds: string[], messages: MessageItem[], scheduledTime: Date) => {
    if (!window.whatsapp) return { success: false };
    try {
      return await window.whatsapp.scheduleMessages(contactIds, messages, scheduledTime.toISOString());
    } catch (error) {
      console.error('Error scheduling messages:', error);
      return { success: false };
    }
  }, []);

  const getScheduledMessages = useCallback(async () => {
    if (!window.whatsapp) return [];
    try {
      return await window.whatsapp.getScheduledMessages();
    } catch (error) {
      console.error('Error getting scheduled messages:', error);
      return [];
    }
  }, []);

  const cancelScheduled = useCallback(async (scheduledId: string) => {
    if (!window.whatsapp) return { success: false };
    try {
      return await window.whatsapp.cancelScheduled(scheduledId);
    } catch (error) {
      console.error('Error canceling scheduled message:', error);
      return { success: false };
    }
  }, []);

  const retryScheduled = useCallback(async (scheduledId: string) => {
    if (!window.whatsapp) return { success: false };
    try {
      return await window.whatsapp.retryScheduled(scheduledId);
    } catch (error) {
      console.error('Error retrying scheduled message:', error);
      return { success: false };
    }
  }, []);

  const clearScheduledHistory = useCallback(async () => {
    if (!window.whatsapp) return { success: false };
    try {
      return await window.whatsapp.clearScheduledHistory();
    } catch (error) {
      console.error('Error clearing scheduled history:', error);
      return { success: false };
    }
  }, []);

  return {
    isConnected,
    qrCode,
    isLoading,
    getContacts,
    getChatHistory,
    sendMessage,
    sendMessages,
    scheduleMessages,
    getScheduledMessages,
    cancelScheduled,
    retryScheduled,
    clearScheduledHistory,
    filterContacts,
  };
}
