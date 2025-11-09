import { ContactCard, type Contact } from "../ContactCard";
import { ThemeProvider } from "../ThemeProvider";

export default function ContactCardExample() {
  const mockContact: Contact = {
    id: "1",
    name: "Sarah Johnson",
    phone: "+1 234 567 8900",
    lastMessage: "Thanks for the update! Looking forward to it.",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 15),
    labels: ["Client", "Priority"],
    isFromMe: false,
  };

  return (
    <ThemeProvider>
      <div className="p-8 bg-background max-w-md">
        <ContactCard contact={mockContact} />
      </div>
    </ThemeProvider>
  );
}
