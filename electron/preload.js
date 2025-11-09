const { contextBridge, ipcRenderer } = require('electron');

// Expose WhatsApp API to renderer process
contextBridge.exposeInMainWorld('whatsapp', {
  getStatus: () => ipcRenderer.invoke('whatsapp:getStatus'),
  getContacts: () => ipcRenderer.invoke('whatsapp:getContacts'),
  getChatHistory: (contactId) => ipcRenderer.invoke('whatsapp:getChatHistory', contactId),
  sendMessage: (contactId, message) => ipcRenderer.invoke('whatsapp:sendMessage', contactId, message),
  sendMessages: (contactIds, messages) => ipcRenderer.invoke('whatsapp:sendMessages', contactIds, messages),
  scheduleMessages: (contactIds, messages, scheduledTime) => ipcRenderer.invoke('whatsapp:scheduleMessages', contactIds, messages, scheduledTime),
  getScheduledMessages: () => ipcRenderer.invoke('whatsapp:getScheduledMessages'),
  cancelScheduled: (scheduledId) => ipcRenderer.invoke('whatsapp:cancelScheduled', scheduledId),
  retryScheduled: (scheduledId) => ipcRenderer.invoke('whatsapp:retryScheduled', scheduledId),
  clearScheduledHistory: () => ipcRenderer.invoke('whatsapp:clearScheduledHistory'),
  filterContacts: (criteria) => ipcRenderer.invoke('whatsapp:filterContacts', criteria),
  
  // Event listeners
  onQRCode: (callback) => {
    ipcRenderer.on('whatsapp:qr', (event, qr) => callback(qr));
    return () => ipcRenderer.removeAllListeners('whatsapp:qr');
  },
  onReady: (callback) => {
    ipcRenderer.on('whatsapp:ready', () => callback());
    return () => ipcRenderer.removeAllListeners('whatsapp:ready');
  },
  onAuthenticated: (callback) => {
    ipcRenderer.on('whatsapp:authenticated', () => callback());
    return () => ipcRenderer.removeAllListeners('whatsapp:authenticated');
  },
  onAuthFailure: (callback) => {
    ipcRenderer.on('whatsapp:auth_failure', (event, msg) => callback(msg));
    return () => ipcRenderer.removeAllListeners('whatsapp:auth_failure');
  },
  onDisconnected: (callback) => {
    ipcRenderer.on('whatsapp:disconnected', (event, reason) => callback(reason));
    return () => ipcRenderer.removeAllListeners('whatsapp:disconnected');
  },
  onScheduledSent: (callback) => {
    ipcRenderer.on('scheduled:sent', (event, scheduledId, stats) => callback(scheduledId, stats));
    return () => ipcRenderer.removeAllListeners('scheduled:sent');
  },
  onScheduledPartial: (callback) => {
    ipcRenderer.on('scheduled:partial', (event, scheduledId, stats) => callback(scheduledId, stats));
    return () => ipcRenderer.removeAllListeners('scheduled:partial');
  },
  onScheduledFailed: (callback) => {
    ipcRenderer.on('scheduled:failed', (event, scheduledId, stats) => callback(scheduledId, stats));
    return () => ipcRenderer.removeAllListeners('scheduled:failed');
  },
});
