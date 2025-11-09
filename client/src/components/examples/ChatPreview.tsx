import { ChatPreview, type Message } from "../ChatPreview";
import { ThemeProvider } from "../ThemeProvider";

export default function ChatPreviewExample() {
  const mockMessages: Message[] = [
    {
      id: "1",
      text: "Hey! How are you doing?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      isFromMe: false,
    },
    {
      id: "2",
      text: "I'm doing great, thanks! How about you?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      isFromMe: true,
    },
    {
      id: "3",
      text: "Pretty good! I wanted to ask you about the project",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      isFromMe: false,
    },
    {
      id: "4",
      text: "Sure, what would you like to know?",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      isFromMe: true,
    },
  ];

  return (
    <ThemeProvider>
      <div className="p-8 bg-background max-w-2xl">
        <ChatPreview
          contactName="Sarah Johnson"
          messages={mockMessages}
        />
      </div>
    </ThemeProvider>
  );
}
