import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { QRCodeAuth } from "@/components/QRCodeAuth";
import { MessageSetBuilder, type MessageItem } from "@/components/MessageSetBuilder";
import { ContactFilter, type FilterCriteria } from "@/components/ContactFilter";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { ScheduleDialog } from "@/components/ScheduleDialog";
import { MessageQueue, type QueuedMessage } from "@/components/MessageQueue";
import { ContactCard, type Contact } from "@/components/ContactCard";
import { ChatPreview, type Message } from "@/components/ChatPreview";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { Plus, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type View = "connection" | "message-sets" | "queue" | "send-campaign";

type SavedMessageSet = {
  id: string;
  name: string;
  messages: MessageItem[];
};

export default function HomeElectron() {
  const { toast } = useToast();
  const {
    isConnected,
    qrCode,
    isLoading,
    getContacts,
    getChatHistory,
    sendMessages,
    scheduleMessages,
    filterContacts,
  } = useWhatsApp();

  const [currentView, setCurrentView] = useState<View>("connection");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showMessageBuilder, setShowMessageBuilder] = useState(false);
  
  const [messageSets, setMessageSets] = useState<SavedMessageSet[]>([]);
  const [selectedMessageSet, setSelectedMessageSet] = useState<SavedMessageSet | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterCriteria>({});
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  useEffect(() => {
    if (isConnected && currentView === "connection") {
      setCurrentView("message-sets");
    }
  }, [isConnected, currentView]);

  const handleSaveMessageSet = (name: string, messages: MessageItem[]) => {
    const newSet: SavedMessageSet = {
      id: Date.now().toString(),
      name,
      messages,
    };
    setMessageSets([...messageSets, newSet]);
    setShowMessageBuilder(false);
    toast({
      title: "Message set saved",
      description: `"${name}" has been saved successfully.`,
    });
  };

  const handleFilterChange = async (criteria: FilterCriteria) => {
    setCurrentFilter(criteria);
    setIsLoadingContacts(true);
    try {
      const contacts = await filterContacts(criteria);
      setFilteredContacts(contacts);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to filter contacts",
        variant: "destructive",
      });
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleSelectContact = async (contact: Contact) => {
    setSelectedContact(contact);
    setIsLoadingChat(true);
    try {
      const history = await getChatHistory(contact.id);
      setChatHistory(history);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleSendMessages = () => {
    if (!isConnected) {
      toast({
        title: "Not connected",
        description: "Please connect WhatsApp first",
        variant: "destructive",
      });
      return;
    }
    if (!selectedMessageSet) {
      toast({
        title: "No message set selected",
        description: "Please select a message set first",
        variant: "destructive",
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSend = async (sendNow: boolean) => {
    if (!selectedMessageSet) return;

    if (sendNow) {
      const contactIds = filteredContacts.map((c) => c.id);
      try {
        const results = await sendMessages(contactIds, selectedMessageSet.messages);
        
        const successCount = results.filter((r) => r.success).length;
        const failCount = results.filter((r) => !r.success).length;

        toast({
          title: "Messages sent",
          description: `${successCount} sent successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
        });

        const newQueue: QueuedMessage[] = results.map((r, i) => ({
          id: Date.now().toString() + i,
          contactName: filteredContacts.find((c) => c.id === r.contactId)?.name || 'Unknown',
          messageSetName: selectedMessageSet.name,
          status: r.success ? 'sent' : 'failed',
          sentTime: new Date(),
        }));

        setQueuedMessages([...queuedMessages, ...newQueue]);
        setCurrentView("queue");
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to send messages",
          variant: "destructive",
        });
      }
    } else {
      setShowScheduleDialog(true);
    }
  };

  const handleSchedule = async (date: Date, time: string) => {
    if (!selectedMessageSet) return;

    const contactIds = filteredContacts.map((c) => c.id);
    try {
      const result = await scheduleMessages(contactIds, selectedMessageSet.messages, date);
      
      if (result.success) {
        const newQueue: QueuedMessage[] = filteredContacts.map((contact, i) => ({
          id: Date.now().toString() + i,
          contactName: contact.name,
          messageSetName: selectedMessageSet.name,
          status: 'pending',
          scheduledTime: date,
        }));

        setQueuedMessages([...queuedMessages, ...newQueue]);
        toast({
          title: "Messages scheduled",
          description: `${filteredContacts.length} messages scheduled for ${date.toLocaleString()}`,
        });
        setCurrentView("queue");
      } else {
        toast({
          title: "Error",
          description: "Failed to schedule messages",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule messages",
        variant: "destructive",
      });
    }
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          messageSets={messageSets.map(ms => ({
            id: ms.id,
            name: ms.name,
            messageCount: ms.messages.length,
          }))}
          savedFilters={[]}
          onSelectMessageSet={(id) => {
            const set = messageSets.find(ms => ms.id === id);
            if (set) {
              setSelectedMessageSet(set);
              setCurrentView("send-campaign");
            }
          }}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b gap-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-xl font-semibold">WhatsApp Automation</h1>
            </div>
            <div className="flex items-center gap-2">
              {isConnected && currentView === "send-campaign" && (
                <Button
                  onClick={handleSendMessages}
                  disabled={!selectedMessageSet || filteredContacts.length === 0}
                  data-testid="button-send-messages"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to {filteredContacts.length} contacts
                </Button>
              )}
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="container max-w-7xl mx-auto p-6">
              {currentView === "connection" && (
                <div className="space-y-6">
                  <QRCodeAuth
                    isConnected={isConnected}
                    qrCode={qrCode || undefined}
                  />
                </div>
              )}

              {currentView === "message-sets" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Message Sets</h2>
                    <Button
                      onClick={() => setShowMessageBuilder(!showMessageBuilder)}
                      data-testid="button-new-message-set"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Message Set
                    </Button>
                  </div>

                  {showMessageBuilder && (
                    <MessageSetBuilder onSave={handleSaveMessageSet} />
                  )}

                  {messageSets.length === 0 && !showMessageBuilder && (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No message sets yet. Create your first message set to get started.</p>
                    </div>
                  )}
                </div>
              )}

              {currentView === "send-campaign" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">
                      Send Campaign: {selectedMessageSet?.name}
                    </h2>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                      <ContactFilter
                        availableLabels={[]}
                        onFilterChange={handleFilterChange}
                      />
                    </div>

                    <div className="md:col-span-1">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          Matched Contacts ({filteredContacts.length})
                        </h3>
                        {isLoadingContacts ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : (
                          <ScrollArea className="h-[600px]">
                            <div className="space-y-2">
                              {filteredContacts.map((contact) => (
                                <ContactCard
                                  key={contact.id}
                                  contact={contact}
                                  isSelected={selectedContact?.id === contact.id}
                                  onClick={() => handleSelectContact(contact)}
                                />
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-1">
                      {selectedContact ? (
                        isLoadingChat ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : (
                          <ChatPreview
                            contactName={selectedContact.name}
                            contactAvatar={selectedContact.avatar}
                            messages={chatHistory}
                          />
                        )
                      ) : (
                        <div className="flex items-center justify-center h-full border rounded-md bg-muted/20">
                          <p className="text-muted-foreground">
                            Select a contact to preview chat
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentView === "queue" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold">Message Queue</h2>
                  <MessageQueue
                    messages={queuedMessages}
                    onDelete={(id) => {
                      setQueuedMessages(queuedMessages.filter(m => m.id !== id));
                    }}
                  />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        contacts={filteredContacts}
        messageSetName={selectedMessageSet?.name || ''}
        onConfirm={handleConfirmSend}
      />

      <ScheduleDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        onSchedule={handleSchedule}
      />
    </SidebarProvider>
  );
}
