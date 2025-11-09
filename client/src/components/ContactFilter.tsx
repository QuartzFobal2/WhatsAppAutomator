import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { X } from "lucide-react";

export type FilterCriteria = {
  lastMessageText?: string;
  lastMessageSender?: "me" | "contact" | "any";
  lastMessageWithin?: string;
  labels?: string[];
};

type ContactFilterProps = {
  availableLabels?: string[];
  onFilterChange?: (criteria: FilterCriteria) => void;
};

export function ContactFilter({ availableLabels = [], onFilterChange }: ContactFilterProps) {
  const [criteria, setCriteria] = useState<FilterCriteria>({
    lastMessageSender: "any",
  });
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  const updateCriteria = (updates: Partial<FilterCriteria>) => {
    const newCriteria = { ...criteria, ...updates };
    setCriteria(newCriteria);
    onFilterChange?.(newCriteria);
  };

  const toggleLabel = (label: string) => {
    const newLabels = selectedLabels.includes(label)
      ? selectedLabels.filter((l) => l !== label)
      : [...selectedLabels, label];
    setSelectedLabels(newLabels);
    updateCriteria({ labels: newLabels });
  };

  const clearFilters = () => {
    setCriteria({ lastMessageSender: "any" });
    setSelectedLabels([]);
    onFilterChange?.({});
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">Contact Filters</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          data-testid="button-clear-filters"
        >
          Clear All
        </Button>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={["message", "labels"]} className="w-full">
          <AccordionItem value="message">
            <AccordionTrigger className="text-sm">Last Message</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs">Message contains</Label>
                <Input
                  placeholder="Search message text..."
                  value={criteria.lastMessageText || ""}
                  onChange={(e) => updateCriteria({ lastMessageText: e.target.value })}
                  data-testid="input-message-text-filter"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Sent by</Label>
                <Select
                  value={criteria.lastMessageSender}
                  onValueChange={(value) =>
                    updateCriteria({ lastMessageSender: value as any })
                  }
                >
                  <SelectTrigger data-testid="select-message-sender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Anyone</SelectItem>
                    <SelectItem value="me">Me</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Within</Label>
                <Select
                  value={criteria.lastMessageWithin}
                  onValueChange={(value) => updateCriteria({ lastMessageWithin: value })}
                >
                  <SelectTrigger data-testid="select-time-range">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last hour</SelectItem>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="labels">
            <AccordionTrigger className="text-sm">Labels</AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="flex flex-wrap gap-2">
                {availableLabels.map((label) => (
                  <Badge
                    key={label}
                    variant={selectedLabels.includes(label) ? "default" : "outline"}
                    className="cursor-pointer hover-elevate"
                    onClick={() => toggleLabel(label)}
                    data-testid={`badge-filter-label-${label}`}
                  >
                    {label}
                    {selectedLabels.includes(label) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {(selectedLabels.length > 0 || criteria.lastMessageText) && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {selectedLabels.map((label) => (
                <Badge key={label} variant="secondary" className="text-xs">
                  {label}
                </Badge>
              ))}
              {criteria.lastMessageText && (
                <Badge variant="secondary" className="text-xs">
                  Text: "{criteria.lastMessageText}"
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
