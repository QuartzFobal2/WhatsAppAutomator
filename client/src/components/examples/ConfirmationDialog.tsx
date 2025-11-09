import { useState } from "react";
import { ConfirmationDialog } from "../ConfirmationDialog";
import { ThemeProvider } from "../ThemeProvider";
import { Button } from "@/components/ui/button";
import type { Contact } from "../ContactCard";

export default function ConfirmationDialogExample() {
  const [open, setOpen] = useState(false);

  const mockContacts: Contact[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      phone: "+1 234 567 8900",
      lastMessage: "Thanks for the update!",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 15),
      labels: ["Client", "Priority"],
      isFromMe: false,
    },
    {
      id: "2",
      name: "Mike Davis",
      phone: "+1 234 567 8901",
      lastMessage: "Sounds good to me",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
      labels: ["Lead"],
      isFromMe: false,
    },
  ];

  return (
    <ThemeProvider>
      <div className="p-8 bg-background">
        <Button onClick={() => setOpen(true)}>Open Confirmation Dialog</Button>
        <ConfirmationDialog
          open={open}
          onOpenChange={setOpen}
          contacts={mockContacts}
          messageSetName="Weekly Newsletter"
          onConfirm={(sendNow) => console.log("Send now:", sendNow)}
        />
      </div>
    </ThemeProvider>
  );
}
