import { QRCodeAuth } from "../QRCodeAuth";
import { ThemeProvider } from "../ThemeProvider";

export default function QRCodeAuthExample() {
  return (
    <ThemeProvider>
      <div className="p-8 min-h-screen bg-background">
        <QRCodeAuth
          isConnected={false}
          qrCode="https://wa.me/qr/example-qr-code-data"
        />
      </div>
    </ThemeProvider>
  );
}
