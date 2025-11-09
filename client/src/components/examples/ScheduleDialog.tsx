import { useState } from "react";
import { ScheduleDialog } from "../ScheduleDialog";
import { ThemeProvider } from "../ThemeProvider";
import { Button } from "@/components/ui/button";

export default function ScheduleDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <ThemeProvider>
      <div className="p-8 bg-background">
        <Button onClick={() => setOpen(true)}>Open Schedule Dialog</Button>
        <ScheduleDialog
          open={open}
          onOpenChange={setOpen}
          onSchedule={(date, time) => console.log("Scheduled:", date, time)}
        />
      </div>
    </ThemeProvider>
  );
}
