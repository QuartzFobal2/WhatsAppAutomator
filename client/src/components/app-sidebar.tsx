import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { MessageSquare, Filter, QrCode, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AppSidebarProps = {
  messageSets?: Array<{ id: string; name: string; messageCount: number }>;
  savedFilters?: Array<{ id: string; name: string }>;
  onSelectMessageSet?: (id: string) => void;
  onSelectFilter?: (id: string) => void;
};

export function AppSidebar({
  messageSets = [],
  savedFilters = [],
  onSelectMessageSet,
  onSelectFilter,
}: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton data-testid="link-connection">
                  <QrCode />
                  <span>Connection</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton data-testid="link-message-sets">
                  <MessageSquare />
                  <span>Message Sets</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton data-testid="link-queue">
                  <Clock />
                  <span>Message Queue</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Message Sets</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {messageSets.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No message sets yet
                </div>
              ) : (
                messageSets.map((set) => (
                  <SidebarMenuItem key={set.id}>
                    <SidebarMenuButton
                      onClick={() => onSelectMessageSet?.(set.id)}
                      data-testid={`link-message-set-${set.id}`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="flex-1 truncate">{set.name}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {set.messageCount}
                      </Badge>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Saved Filters</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {savedFilters.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No saved filters
                </div>
              ) : (
                savedFilters.map((filter) => (
                  <SidebarMenuItem key={filter.id}>
                    <SidebarMenuButton
                      onClick={() => onSelectFilter?.(filter.id)}
                      data-testid={`link-filter-${filter.id}`}
                    >
                      <Filter className="h-4 w-4" />
                      <span className="flex-1 truncate">{filter.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
