import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export type Contact = {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  labels: string[];
  isFromMe: boolean;
};

type ContactCardProps = {
  contact: Contact;
  isSelected?: boolean;
  onClick?: () => void;
};

export function ContactCard({ contact, isSelected, onClick }: ContactCardProps) {
  const initials = contact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`flex items-start gap-3 p-4 cursor-pointer hover-elevate rounded-md border ${
        isSelected ? "bg-accent" : "bg-card"
      }`}
      onClick={onClick}
      data-testid={`contact-card-${contact.id}`}
    >
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={contact.avatar} alt={contact.name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h4 className="font-medium text-sm truncate" data-testid={`text-contact-name-${contact.id}`}>
            {contact.name}
          </h4>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatDistanceToNow(contact.lastMessageTime, { addSuffix: true })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mb-2">
          {contact.phone}
        </p>
        <p className="text-sm text-muted-foreground truncate mb-2">
          {contact.isFromMe && <span className="text-xs mr-1">You:</span>}
          {contact.lastMessage}
        </p>
        {contact.labels.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {contact.labels.map((label) => (
              <Badge
                key={label}
                variant="secondary"
                className="text-xs px-2 py-0 h-5"
                data-testid={`badge-label-${label}`}
              >
                {label}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
