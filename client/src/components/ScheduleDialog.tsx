import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

type ScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule?: (date: Date, time: string) => void;
};

export function ScheduleDialog({ open, onOpenChange, onSchedule }: ScheduleDialogProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("12:00");

  const handleSchedule = () => {
    if (date && onSchedule) {
      const [hours, minutes] = time.split(":");
      const scheduledDate = new Date(date);
      scheduledDate.setHours(parseInt(hours), parseInt(minutes));
      onSchedule(scheduledDate, time);
      console.log("Scheduled for:", scheduledDate);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-schedule">
        <DialogHeader>
          <DialogTitle>Schedule Messages</DialogTitle>
          <DialogDescription>
            Choose when to send your messages
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-testid="button-select-date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              data-testid="input-schedule-time"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-schedule"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={!date}
            data-testid="button-confirm-schedule"
          >
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
