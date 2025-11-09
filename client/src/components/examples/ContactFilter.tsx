import { ContactFilter } from "../ContactFilter";
import { ThemeProvider } from "../ThemeProvider";

export default function ContactFilterExample() {
  const mockLabels = ["Client", "Priority", "Lead", "Support", "VIP"];

  return (
    <ThemeProvider>
      <div className="p-8 bg-background max-w-md">
        <ContactFilter
          availableLabels={mockLabels}
          onFilterChange={(criteria) => console.log("Filter changed:", criteria)}
        />
      </div>
    </ThemeProvider>
  );
}
