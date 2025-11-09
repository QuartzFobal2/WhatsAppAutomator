import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type Message = {
  id: string;
  text: string;
  timestamp: Date;
  isFromMe: boolean;
  mediaType?: "image" | "audio" | "video" | "document";
};

type ChatPreviewProps = {
  contactName: string;
  contactAvatar?: string;
  messages: Message[];
};

export function ChatPreview({ contactName, contactAvatar, messages }: ChatPreviewProps) {
  const initials = contactName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-row items-center gap-3 space-y-0 pb-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={contactAvatar} alt={contactName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-base">{contactName}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px] px-6 pb-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isFromMe ? "justify-end" : "justify-start"}`}
                data-testid={`message-${message.id}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.isFromMe
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.isFromMe
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
