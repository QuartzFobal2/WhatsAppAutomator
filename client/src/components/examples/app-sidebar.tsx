import { AppSidebar } from "../app-sidebar";
import { ThemeProvider } from "../ThemeProvider";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppSidebarExample() {
  const mockMessageSets = [
    { id: "1", name: "Weekly Newsletter", messageCount: 3 },
    { id: "2", name: "Product Launch", messageCount: 5 },
    { id: "3", name: "Follow-up Campaign", messageCount: 2 },
  ];

  const mockFilters = [
    { id: "1", name: "Active Clients" },
    { id: "2", name: "Recent Conversations" },
    { id: "3", name: "VIP Contacts" },
  ];

  return (
    <ThemeProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full bg-background">
          <AppSidebar
            messageSets={mockMessageSets}
            savedFilters={mockFilters}
            onSelectMessageSet={(id) => console.log("Selected set:", id)}
            onSelectFilter={(id) => console.log("Selected filter:", id)}
          />
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
