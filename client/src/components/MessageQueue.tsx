import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { CheckCircle2, Clock, XCircle, Trash2 } from "lucide-react";

export type QueuedMessage = {
  id: string;
  contactName: string;
  messageSetName: string;
  status: "pending" | "sent" | "failed";
  scheduledTime?: Date;
  sentTime?: Date;
};

type MessageQueueProps = {
  messages: QueuedMessage[];
  onDelete?: (id: string) => void;
};

export function MessageQueue({ messages, onDelete }: MessageQueueProps) {
  const getStatusBadge = (status: QueuedMessage["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "sent":
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Sent
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Message Queue</CardTitle>
          <Badge variant="secondary" data-testid="badge-queue-count">
            {messages.length} messages
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Message Set</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No messages in queue
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((message) => (
                  <TableRow key={message.id} data-testid={`queue-item-${message.id}`}>
                    <TableCell className="font-medium">
                      {message.contactName}
                    </TableCell>
                    <TableCell>{message.messageSetName}</TableCell>
                    <TableCell>{getStatusBadge(message.status)}</TableCell>
                    <TableCell>
                      {message.scheduledTime
                        ? format(message.scheduledTime, "PPp")
                        : "Immediate"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete?.(message.id)}
                        data-testid={`button-delete-${message.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
