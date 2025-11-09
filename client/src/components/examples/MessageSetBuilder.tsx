import { MessageSetBuilder } from "../MessageSetBuilder";
import { ThemeProvider } from "../ThemeProvider";

export default function MessageSetBuilderExample() {
  return (
    <ThemeProvider>
      <div className="p-8 bg-background max-w-3xl">
        <MessageSetBuilder
          onSave={(name, messages) => {
            console.log("Saved:", name, messages);
          }}
        />
      </div>
    </ThemeProvider>
  );
}
