import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { QRCodeAuth } from "@/components/QRCodeAuth";
import { MessageSetBuilder } from "@/components/MessageSetBuilder";
import { ContactFilter } from "@/components/ContactFilter";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { ScheduleDialog } from "@/components/ScheduleDialog";
import { MessageQueue } from "@/components/MessageQueue";
import { Plus, Send } from "lucide-react";
import type { Contact } from "@/components/ContactCard";
import type { QueuedMessage } from "@/components/MessageQueue";

type View = "connection" | "message-sets" | "queue";

export default function Home() {
  const [currentView, setCurrentView] = useState<View>("connection");
  const [isConnected, setIsConnected] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showMessageBuilder, setShowMessageBuilder] = useState(false);

  const mockContacts: Contact[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      phone: "+1 234 567 8900",
      lastMessage: "Thanks for the update! Looking forward to it.",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 15),
      labels: ["Client", "Priority"],
      isFromMe: false,
    },
    {
      id: "2",
      name: "Mike Davis",
      phone: "+1 234 567 8901",
      lastMessage: "Sounds good to me, let's do it!",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
      labels: ["Lead"],
      isFromMe: false,
    },
    {
      id: "3",
      name: "Emma Wilson",
      phone: "+1 234 567 8902",
      lastMessage: "Perfect, see you then!",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 45),
      labels: ["Client", "VIP"],
      isFromMe: true,
    },
  ];

  const mockQueuedMessages: QueuedMessage[] = [
    {
      id: "1",
      contactName: "Sarah Johnson",
      messageSetName: "Weekly Newsletter",
      status: "pending",
      scheduledTime: new Date(Date.now() + 1000 * 60 * 60 * 2),
    },
    {
      id: "2",
      contactName: "Mike Davis",
      messageSetName: "Product Launch",
      status: "sent",
      sentTime: new Date(Date.now() - 1000 * 60 * 30),
    },
  ];

  const mockMessageSets = [
    { id: "1", name: "Weekly Newsletter", messageCount: 3 },
    { id: "2", name: "Product Launch", messageCount: 5 },
    { id: "3", name: "Follow-up Campaign", messageCount: 2 },
  ];

  const mockSavedFilters = [
    { id: "1", name: "Active Clients" },
    { id: "2", name: "Recent Conversations" },
    { id: "3", name: "VIP Contacts" },
  ];

  const mockLabels = ["Client", "Priority", "Lead", "Support", "VIP"];

  const handleSendMessages = () => {
    if (!isConnected) {
      console.log("Please connect WhatsApp first");
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSend = (sendNow: boolean) => {
    if (sendNow) {
      console.log("Sending messages now...");
    } else {
      setShowScheduleDialog(true);
    }
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          messageSets={mockMessageSets}
          savedFilters={mockSavedFilters}
          onSelectMessageSet={(id) => {
            console.log("Selected message set:", id);
            setCurrentView("message-sets");
          }}
          onSelectFilter={(id) => console.log("Selected filter:", id)}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b gap-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-xl font-semibold">WhatsApp Automation</h1>
            </div>
            <div className="flex items-center gap-2">
              {isConnected && (
                <Button
                  onClick={handleSendMessages}
                  data-testid="button-send-messages"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Messages
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
                    qrCode={!isConnected ? "https://wa.me/qr/example-qr-code" : undefined}
                  />
                  {!isConnected && (
                    <div className="flex justify-center">
                      <Button
                        onClick={() => setIsConnected(true)}
                        data-testid="button-simulate-connection"
                      >
                        Simulate Connection
                      </Button>
                    </div>
                  )}
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
                    <MessageSetBuilder
                      onSave={(name, messages) => {
                        console.log("Saved:", name, messages);
                        setShowMessageBuilder(false);
                      }}
                    />
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <ContactFilter
                      availableLabels={mockLabels}
                      onFilterChange={(criteria) => console.log("Filter:", criteria)}
                    />
                  </div>
                </div>
              )}

              {currentView === "queue" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold">Message Queue</h2>
                  <MessageQueue
                    messages={mockQueuedMessages}
                    onDelete={(id) => console.log("Delete:", id)}
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
        contacts={mockContacts}
        messageSetName="Weekly Newsletter"
        onConfirm={handleConfirmSend}
      />

      <ScheduleDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        onSchedule={(date, time) => {
          console.log("Scheduled for:", date, time);
        }}
      />
    </SidebarProvider>
  );
}
