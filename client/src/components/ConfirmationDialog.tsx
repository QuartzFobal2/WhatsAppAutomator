import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ContactCard, type Contact } from "./ContactCard";
import { ChatPreview, type Message } from "./ChatPreview";
import { ArrowRight, Send, Calendar } from "lucide-react";

type ConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
  messageSetName: string;
  onConfirm?: (sendNow: boolean) => void;
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  contacts,
  messageSetName,
  onConfirm,
}: ConfirmationDialogProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(
    contacts[0] || null
  );

  const mockMessages: Message[] = [
    {
      id: "1",
      text: "Hello! How can I help you today?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      isFromMe: false,
    },
    {
      id: "2",
      text: "I was wondering about your services",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      isFromMe: true,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]" data-testid="dialog-confirmation">
        <DialogHeader>
          <DialogTitle>Confirm Recipients</DialogTitle>
          <DialogDescription>
            Review matched contacts and their chat history before sending
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2">
          <Badge variant="outline" className="text-sm">
            Message Set: {messageSetName}
          </Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary" className="text-sm">
            {contacts.length} contacts matched
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-3">Matched Contacts</h3>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedContact?.id === contact.id}
                    onClick={() => setSelectedContact(contact)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Chat Preview</h3>
            {selectedContact ? (
              <ChatPreview
                contactName={selectedContact.name}
                contactAvatar={selectedContact.avatar}
                messages={mockMessages}
              />
            ) : (
              <div className="flex items-center justify-center h-[400px] border rounded-md bg-muted/20">
                <p className="text-muted-foreground">Select a contact to preview chat</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-send"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onConfirm?.(false);
              onOpenChange(false);
            }}
            data-testid="button-schedule-send"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
          <Button
            onClick={() => {
              onConfirm?.(true);
              onOpenChange(false);
            }}
            data-testid="button-send-now"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
