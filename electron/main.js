const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const log = require('electron-log');
const Store = require('electron-store');
const db = require('./database-wrapper.cjs');

// Configure electron-log
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// Configure electron-store for settings
const store = new Store({
  defaults: {
    contactsLimit: 100,
    messageDelay: { min: 2000, max: 5000 },
    dailyMessageLimit: 1000,
    puppeteerHeadless: true,
  },
});

let mainWindow;
let whatsappClient;
let isClientReady = false;
let qrCodeData = null;
let schedulerInterval = null;

// Load persisted rate limiting counters
let dailyMessageCount = store.get('dailyMessageCount', 0);
let lastResetDate = store.get('lastResetDate', new Date().toDateString());

function createWindow() {
  log.info('Creating main window...');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: 'WhatsApp Automation',
    backgroundColor: '#f8fafc',
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.webContents.openDevTools();
    log.info('Loaded development URL: http://localhost:5000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/public/index.html'));
    log.info('Loaded production HTML');
  }

  mainWindow.on('closed', () => {
    log.info('Main window closed');
    mainWindow = null;
  });
}

function initializeWhatsApp() {
  log.info('Initializing WhatsApp client...');
  
  const puppeteerConfig = store.get('puppeteerHeadless', true);
  
  whatsappClient = new Client({
    authStrategy: new LocalAuth({
      dataPath: path.join(app.getPath('userData'), 'whatsapp-session'),
    }),
    puppeteer: {
      headless: puppeteerConfig,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    },
  });

  whatsappClient.on('qr', (qr) => {
    log.info('QR Code received');
    qrcode.generate(qr, { small: true });
    qrCodeData = qr;
    if (mainWindow) {
      mainWindow.webContents.send('whatsapp:qr', qr);
    }
  });

  whatsappClient.on('ready', () => {
    log.info('WhatsApp client is ready!');
    isClientReady = true;
    qrCodeData = null;
    if (mainWindow) {
      mainWindow.webContents.send('whatsapp:ready');
    }
  });

  whatsappClient.on('authenticated', () => {
    log.info('WhatsApp authenticated');
    if (mainWindow) {
      mainWindow.webContents.send('whatsapp:authenticated');
    }
  });

  whatsappClient.on('auth_failure', (msg) => {
    log.error('WhatsApp authentication failure:', msg);
    if (mainWindow) {
      mainWindow.webContents.send('whatsapp:auth_failure', msg);
    }
  });

  whatsappClient.on('disconnected', (reason) => {
    log.warn('WhatsApp disconnected:', reason);
    isClientReady = false;
    if (mainWindow) {
      mainWindow.webContents.send('whatsapp:disconnected', reason);
    }
  });

  whatsappClient.initialize();
}

app.whenReady().then(() => {
  log.info('App is ready');
  
  // Initialize database
  try {
    db.initDatabase(app.getPath('userData'));
    log.info('Database initialized successfully');
  } catch (error) {
    log.error('Failed to initialize database:', error);
  }
  
  // Reset daily limit if needed (BEFORE any operations)
  resetDailyLimitIfNeeded();
  log.info(`Daily message count loaded: ${dailyMessageCount} (last reset: ${lastResetDate})`);
  
  createWindow();
  initializeWhatsApp();
  startScheduler();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (whatsappClient) {
      whatsappClient.destroy();
      log.info('WhatsApp client destroyed');
    }
    if (schedulerInterval) {
      clearInterval(schedulerInterval);
    }
    app.quit();
  }
});

// Reset daily message count if new day
function resetDailyLimitIfNeeded() {
  const today = new Date().toDateString();
  if (lastResetDate !== today) {
    dailyMessageCount = 0;
    lastResetDate = today;
    
    // Persist the reset values
    store.set('dailyMessageCount', 0);
    store.set('lastResetDate', today);
    
    log.info('Daily message count reset to 0 for new day:', today);
  }
}

// Persist daily message count (called after each message sent)
function persistDailyCount() {
  store.set('dailyMessageCount', dailyMessageCount);
  store.set('lastResetDate', lastResetDate);
}

// Scheduler for sending messages at scheduled times
function startScheduler() {
  log.info('Starting message scheduler...');
  
  schedulerInterval = setInterval(async () => {
    try {
      resetDailyLimitIfNeeded();
      
      const scheduledMessages = db.getAllScheduledMessages();
      const now = new Date();
      const toSend = scheduledMessages.filter(
        msg => msg.scheduledTime <= now && msg.status === 'pending'
      );

      for (const scheduled of toSend) {
        try {
          log.info(`Processing scheduled message ${scheduled.id}`);
          const results = await sendMessageBatch(scheduled.contactIds, scheduled.messages);
          
          const successCount = results.filter(r => r.success).length;
          const failCount = results.filter(r => !r.success).length;
          
          if (failCount === 0) {
            scheduled.status = 'sent';
            scheduled.sentTime = new Date();
            
            if (mainWindow) {
              mainWindow.webContents.send('scheduled:sent', scheduled.id, {
                total: results.length,
                successful: successCount,
                failed: failCount,
              });
            }
          } else if (successCount === 0) {
            scheduled.status = 'failed';
            scheduled.error = `All ${failCount} messages failed to send`;
            
            if (mainWindow) {
              mainWindow.webContents.send('scheduled:failed', scheduled.id, {
                total: results.length,
                successful: successCount,
                failed: failCount,
                errors: results.filter(r => !r.success).map(r => r.error),
              });
            }
          } else {
            scheduled.status = 'partial';
            scheduled.error = `${failCount} of ${results.length} messages failed`;
            scheduled.sentTime = new Date();
            
            if (mainWindow) {
              mainWindow.webContents.send('scheduled:partial', scheduled.id, {
                total: results.length,
                successful: successCount,
                failed: failCount,
                errors: results.filter(r => !r.success).map(r => r.error),
              });
            }
          }
          
          scheduled.results = results;
          
          // Save updated status to database
          db.saveScheduledMessage(scheduled);
          log.info(`Scheduled message ${scheduled.id} completed with status: ${scheduled.status}`);
        } catch (error) {
          log.error(`Error processing scheduled message ${scheduled.id}:`, error);
          
          scheduled.status = 'failed';
          scheduled.error = error.message;
          db.saveScheduledMessage(scheduled);
          
          if (mainWindow) {
            mainWindow.webContents.send('scheduled:failed', scheduled.id, {
              total: scheduled.contactIds.length,
              successful: 0,
              failed: scheduled.contactIds.length,
              errors: [error.message],
            });
          }
        }
      }
    } catch (error) {
      log.error('Error in scheduler:', error);
    }
  }, 10000); // Check every 10 seconds
}

async function sendMessageBatch(contactIds, messages) {
  if (!isClientReady) {
    throw new Error('WhatsApp client not ready');
  }

  const dailyLimit = store.get('dailyMessageLimit', 1000);
  if (dailyMessageCount >= dailyLimit) {
    throw new Error(`Daily message limit of ${dailyLimit} reached. Please try again tomorrow.`);
  }

  const results = [];
  const delay = store.get('messageDelay', { min: 2000, max: 5000 });

  for (const contactId of contactIds) {
    try {
      // Validate contactId
      if (!contactId || typeof contactId !== 'string') {
        throw new Error('Invalid contact ID');
      }

      const chat = await whatsappClient.getChatById(contactId);
      
      for (const message of messages) {
        // Check daily limit before each message
        if (dailyMessageCount >= dailyLimit) {
          log.warn('Daily message limit reached mid-batch');
          throw new Error(`Daily message limit reached`);
        }

        if (message.type === 'text') {
          if (!message.content || message.content.trim().length === 0) {
            log.warn('Skipping empty text message');
            continue;
          }
          await chat.sendMessage(message.content);
        } else if (['image', 'video', 'audio', 'file'].includes(message.type)) {
          if (message.filePath && fs.existsSync(message.filePath)) {
            const media = MessageMedia.fromFilePath(message.filePath);
            await chat.sendMessage(media, { caption: message.content || '' });
          } else if (message.base64Data) {
            const mimeTypes = {
              'image': 'image/jpeg',
              'video': 'video/mp4',
              'audio': 'audio/mpeg',
              'file': 'application/pdf',
            };
            const media = new MessageMedia(
              mimeTypes[message.type] || 'application/octet-stream',
              message.base64Data,
              message.fileName || `file.${message.type}`
            );
            await chat.sendMessage(media, { caption: message.content || '' });
          } else {
            log.warn(`Skipping ${message.type} message - no file path or data provided`);
            continue;
          }
        }
        
        dailyMessageCount++;
        persistDailyCount(); // Persist immediately after increment
        
        // Random delay between messages (2-5 seconds by default)
        const randomDelay = Math.floor(Math.random() * (delay.max - delay.min + 1)) + delay.min;
        await new Promise(resolve => setTimeout(resolve, randomDelay));
      }

      results.push({ contactId, success: true });
      
      // Save send log
      db.saveSendLog(
        `${Date.now()}-${contactId}`,
        contactId,
        null,
        'success',
        null
      );
      
      log.info(`Successfully sent to ${contactId}`);
    } catch (error) {
      log.error(`Error sending to ${contactId}:`, error);
      results.push({ contactId, success: false, error: error.message });
      
      // Save error log
      db.saveSendLog(
        `${Date.now()}-${contactId}`,
        contactId,
        null,
        'failed',
        error.message
      );
    }
  }

  return results;
}

// IPC Handlers
ipcMain.handle('whatsapp:getStatus', async () => {
  try {
    return {
      isReady: isClientReady,
      qrCode: qrCodeData,
      dailyMessageCount,
      dailyMessageLimit: store.get('dailyMessageLimit', 1000),
    };
  } catch (error) {
    log.error('Error getting status:', error);
    throw error;
  }
});

ipcMain.handle('whatsapp:getContacts', async () => {
  if (!isClientReady) {
    throw new Error('WhatsApp client not ready');
  }

  try {
    const limit = store.get('contactsLimit', 100);
    const chats = await whatsappClient.getChats();
    const contacts = await Promise.all(
      chats.slice(0, limit).map(async (chat) => {
        try {
          const contact = await chat.getContact();
          const messages = await chat.fetchMessages({ limit: 1 });
          const lastMessage = messages[0];

          return {
            id: contact.id._serialized,
            name: contact.name || contact.pushname || contact.number,
            phone: contact.number,
            avatar: await contact.getProfilePicUrl().catch(() => undefined),
            lastMessage: lastMessage?.body || '',
            lastMessageTime: lastMessage?.timestamp ? new Date(lastMessage.timestamp * 1000) : new Date(),
            labels: [],
            isFromMe: lastMessage?.fromMe || false,
          };
        } catch (error) {
          log.warn(`Error processing contact:`, error);
          return null;
        }
      })
    );

    return contacts.filter(c => c !== null);
  } catch (error) {
    log.error('Error fetching contacts:', error);
    throw error;
  }
});

ipcMain.handle('whatsapp:getChatHistory', async (event, contactId) => {
  if (!isClientReady) {
    throw new Error('WhatsApp client not ready');
  }

  if (!contactId || typeof contactId !== 'string') {
    throw new Error('Invalid contact ID');
  }

  try {
    const chat = await whatsappClient.getChatById(contactId);
    const messages = await chat.fetchMessages({ limit: 20 });

    return messages.map((msg) => ({
      id: msg.id._serialized,
      text: msg.body,
      timestamp: new Date(msg.timestamp * 1000),
      isFromMe: msg.fromMe,
      mediaType: msg.hasMedia ? msg.type : undefined,
    }));
  } catch (error) {
    log.error(`Error fetching chat history for ${contactId}:`, error);
    throw error;
  }
});

ipcMain.handle('whatsapp:sendMessage', async (event, contactId, message) => {
  if (!isClientReady) {
    throw new Error('WhatsApp client not ready');
  }

  if (!contactId || typeof contactId !== 'string') {
    throw new Error('Invalid contact ID');
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('Invalid message content');
  }

  try {
    const chat = await whatsappClient.getChatById(contactId);
    await chat.sendMessage(message);
    log.info(`Message sent to ${contactId}`);
    return { success: true };
  } catch (error) {
    log.error(`Error sending message to ${contactId}:`, error);
    throw error;
  }
});

ipcMain.handle('whatsapp:sendMessages', async (event, contactIds, messages) => {
  try {
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      throw new Error('Invalid contact IDs');
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid messages');
    }
    
    log.info(`Sending batch of ${messages.length} messages to ${contactIds.length} contacts`);
    return await sendMessageBatch(contactIds, messages);
  } catch (error) {
    log.error('Error in sendMessages:', error);
    throw error;
  }
});

ipcMain.handle('whatsapp:scheduleMessages', async (event, contactIds, messages, scheduledTime) => {
  try {
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      throw new Error('Invalid contact IDs');
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid messages');
    }
    
    const scheduleDate = new Date(scheduledTime);
    if (scheduleDate <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    const scheduled = {
      id: Date.now().toString(),
      contactIds,
      messages,
      scheduledTime: scheduleDate,
      status: 'pending',
      createdAt: new Date(),
    };

    db.saveScheduledMessage(scheduled);
    log.info(`Scheduled message ${scheduled.id} for ${scheduleDate.toISOString()}`);
    
    return { success: true, scheduledId: scheduled.id };
  } catch (error) {
    log.error('Error scheduling messages:', error);
    throw error;
  }
});

ipcMain.handle('whatsapp:getScheduledMessages', async () => {
  try {
    return db.getAllScheduledMessages();
  } catch (error) {
    log.error('Error getting scheduled messages:', error);
    throw error;
  }
});

ipcMain.handle('whatsapp:cancelScheduled', async (event, scheduledId) => {
  try {
    if (!scheduledId) {
      throw new Error('Invalid scheduled message ID');
    }

    const messages = db.getAllScheduledMessages();
    const msg = messages.find(m => m.id === scheduledId);
    
    if (!msg) {
      return { success: false, error: 'Scheduled message not found' };
    }
    
    if (msg.status !== 'pending') {
      return { success: false, error: 'Can only cancel pending messages' };
    }
    
    db.deleteScheduledMessage(scheduledId);
    log.info(`Cancelled scheduled message ${scheduledId}`);
    return { success: true };
  } catch (error) {
    log.error('Error cancelling scheduled message:', error);
    throw error;
  }
});

ipcMain.handle('whatsapp:retryScheduled', async (event, scheduledId) => {
  try {
    if (!scheduledId) {
      throw new Error('Invalid scheduled message ID');
    }

    const messages = db.getAllScheduledMessages();
    const scheduled = messages.find(m => m.id === scheduledId);
    
    if (!scheduled) {
      return { success: false, error: 'Scheduled message not found' };
    }
    
    if (scheduled.status === 'pending') {
      return { success: false, error: 'Message is already pending' };
    }
    
    scheduled.status = 'pending';
    scheduled.error = null;
    scheduled.sentTime = null;
    scheduled.results = undefined;
    
    db.saveScheduledMessage(scheduled);
    log.info(`Retrying scheduled message ${scheduledId}`);
    
    return { success: true };
  } catch (error) {
    log.error('Error retrying scheduled message:', error);
    throw error;
  }
});

ipcMain.handle('whatsapp:clearScheduledHistory', async () => {
  try {
    db.clearCompletedScheduledMessages();
    log.info('Cleared completed scheduled messages');
    return { success: true };
  } catch (error) {
    log.error('Error clearing scheduled history:', error);
    throw error;
  }
});

ipcMain.handle('whatsapp:filterContacts', async (event, criteria) => {
  if (!isClientReady) {
    throw new Error('WhatsApp client not ready');
  }

  try {
    const limit = store.get('contactsLimit', 100);
    const chats = await whatsappClient.getChats();
    const filtered = [];

    for (const chat of chats.slice(0, limit)) {
      try {
        const contact = await chat.getContact();
        const messages = await chat.fetchMessages({ limit: 10 });
        
        let matches = true;

        // Filter by last message text
        if (criteria.lastMessageText && messages.length > 0) {
          const hasMatch = messages.some(msg => 
            msg.body.toLowerCase().includes(criteria.lastMessageText.toLowerCase())
          );
          if (!hasMatch) matches = false;
        }

        // Filter by sender
        if (criteria.lastMessageSender && criteria.lastMessageSender !== 'any' && messages.length > 0) {
          const lastMsg = messages[0];
          if (criteria.lastMessageSender === 'me' && !lastMsg.fromMe) matches = false;
          if (criteria.lastMessageSender === 'contact' && lastMsg.fromMe) matches = false;
        }

        // Filter by time
        if (criteria.lastMessageWithin && messages.length > 0) {
          const lastMsg = messages[0];
          const msgTime = new Date(lastMsg.timestamp * 1000);
          const now = new Date();
          const diff = now - msgTime;

          const timeRanges = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
          };

          if (diff > timeRanges[criteria.lastMessageWithin]) {
            matches = false;
          }
        }

        if (matches) {
          const lastMessage = messages[0];
          filtered.push({
            id: contact.id._serialized,
            name: contact.name || contact.pushname || contact.number,
            phone: contact.number,
            avatar: await contact.getProfilePicUrl().catch(() => undefined),
            lastMessage: lastMessage?.body || '',
            lastMessageTime: lastMessage?.timestamp ? new Date(lastMessage.timestamp * 1000) : new Date(),
            labels: [],
            isFromMe: lastMessage?.fromMe || false,
          });
        }
      } catch (error) {
        log.warn('Error processing chat in filter:', error);
      }
    }

    log.info(`Filtered ${filtered.length} contacts from ${chats.length} total`);
    return filtered;
  } catch (error) {
    log.error('Error filtering contacts:', error);
    throw error;
  }
});

// Message Sets IPC Handlers
ipcMain.handle('messageSets:getAll', async () => {
  try {
    return db.getAllMessageSets();
  } catch (error) {
    log.error('Error getting message sets:', error);
    throw error;
  }
});

ipcMain.handle('messageSets:save', async (event, id, name, messages) => {
  try {
    if (!name || name.trim().length === 0) {
      throw new Error('Message set name is required');
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('At least one message is required');
    }
    
    db.saveMessageSet(id, name, messages);
    log.info(`Saved message set ${id}: ${name}`);
    return { success: true };
  } catch (error) {
    log.error('Error saving message set:', error);
    throw error;
  }
});

ipcMain.handle('messageSets:delete', async (event, id) => {
  try {
    if (!id) {
      throw new Error('Message set ID is required');
    }
    
    db.deleteMessageSet(id);
    log.info(`Deleted message set ${id}`);
    return { success: true };
  } catch (error) {
    log.error('Error deleting message set:', error);
    throw error;
  }
});

// Settings IPC Handlers
ipcMain.handle('settings:get', async (event, key) => {
  try {
    return store.get(key);
  } catch (error) {
    log.error('Error getting setting:', error);
    throw error;
  }
});

ipcMain.handle('settings:set', async (event, key, value) => {
  try {
    store.set(key, value);
    log.info(`Setting updated: ${key}`);
    return { success: true };
  } catch (error) {
    log.error('Error setting setting:', error);
    throw error;
  }
});

ipcMain.handle('settings:getAll', async () => {
  try {
    return store.store;
  } catch (error) {
    log.error('Error getting all settings:', error);
    throw error;
  }
});
