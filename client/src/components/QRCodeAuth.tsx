import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Smartphone } from "lucide-react";

type QRCodeAuthProps = {
  isConnected: boolean;
  qrCode?: string;
};

export function QRCodeAuth({ isConnected, qrCode }: QRCodeAuthProps) {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">WhatsApp Connection</CardTitle>
          {isConnected ? (
            <Badge variant="default" className="gap-1" data-testid="badge-connection-status">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary" data-testid="badge-connection-status">
              Disconnected
            </Badge>
          )}
        </div>
        <CardDescription>
          {isConnected
            ? "Your WhatsApp is connected and ready to use"
            : "Scan the QR code with your WhatsApp to connect"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected && qrCode && (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-md">
              <QRCodeSVG value={qrCode} size={256} />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Smartphone className="h-4 w-4" />
              <span>Open WhatsApp → Settings → Linked Devices → Link a Device</span>
            </div>
          </div>
        )}
        {isConnected && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              You can now create and send message campaigns
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
