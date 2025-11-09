import { MessageQueue, type QueuedMessage } from "../MessageQueue";
import { ThemeProvider } from "../ThemeProvider";

export default function MessageQueueExample() {
  const mockMessages: QueuedMessage[] = [
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
    {
      id: "3",
      contactName: "Emma Wilson",
      messageSetName: "Follow-up",
      status: "failed",
      scheduledTime: new Date(Date.now() - 1000 * 60 * 15),
    },
  ];

  return (
    <ThemeProvider>
      <div className="p-8 bg-background">
        <MessageQueue
          messages={mockMessages}
          onDelete={(id) => console.log("Delete:", id)}
        />
      </div>
    </ThemeProvider>
  );
}
