import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface QRScannerProps {
  /** Called with the decoded text of the QR code. */
  onScan: (text: string) => void;
  onClose?: () => void;
  className?: string;
}

/** Camera QR scanner used for ID-card sign-in and attendance scanning. */
export const QRScanner = ({ onScan, onClose, className }: QRScannerProps) => {
  const containerId = useRef(`qr-${Math.random().toString(36).slice(2)}`);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode(containerId.current, false);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          if (cancelled) return;
          cancelled = true;
          scanner.stop().catch(() => undefined);
          onScan(decoded);
        },
        () => undefined,
      )
      .then(() => !cancelled && setStarting(false))
      .catch(() => {
        setStarting(false);
        setError("Could not open the camera. Allow camera access, or enter your details manually.");
      });

    return () => {
      cancelled = true;
      scanner.stop().catch(() => undefined);
    };
  }, [onScan]);

  return (
    <div className={className}>
      <div className="relative rounded-xl overflow-hidden bg-muted aspect-square">
        <div id={containerId.current} className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />
        {starting && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Hold the QR code on the ID card steady inside the frame.
      </p>
      {onClose && (
        <Button variant="outline" className="w-full mt-3" onClick={onClose}>
          Cancel
        </Button>
      )}
    </div>
  );
};

export default QRScanner;
