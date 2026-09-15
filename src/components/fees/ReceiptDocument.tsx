import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { naira, printDocument } from "@/lib/finance";

interface Props {
  receipt: any;
  studentName: string;
  invoiceSerial?: string | null;
  balanceAfter?: number | null;
  compact?: boolean;
}

/** Branded, printable payment receipt with its own serial number. */
export const ReceiptDocument = ({ receipt, studentName, invoiceSerial, balanceAfter, compact }: Props) => {
  const domId = `receipt-doc-${receipt.id}`;

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div id={domId} className="p-4">
        <div className="meta flex flex-wrap justify-between gap-3 text-xs sm:text-sm">
          <div>
            <p><strong>Receipt:</strong> {receipt.serial}</p>
            <p><strong>Received from:</strong> {studentName}</p>
            {invoiceSerial && <p><strong>Against invoice:</strong> {invoiceSerial}</p>}
          </div>
          <div className="sm:text-right">
            <p><strong>Amount:</strong> {naira(receipt.amount)}</p>
            <p><strong>Method:</strong> <span className="capitalize">{receipt.method}</span></p>
            <p><strong>Date:</strong> {new Date(receipt.issued_at || receipt.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>
        {receipt.reference && <p className="text-xs text-muted-foreground mt-2">Reference: {receipt.reference}</p>}
        {typeof balanceAfter === "number" && (
          <p className="text-xs mt-1">
            Outstanding balance after this payment:{" "}
            <span className={balanceAfter > 0 ? "text-destructive font-semibold" : "text-success font-semibold"}>{naira(balanceAfter)}</span>
          </p>
        )}
        {!compact && (
          <div className="stamp mt-6 flex justify-between text-[11px] text-muted-foreground">
            <span>Received by: ____________________</span>
            <span>School stamp</span>
          </div>
        )}
      </div>
      <div className="px-4 pb-3 no-print">
        <Button
          size="sm"
          variant="ghost"
          className="text-xs hover:bg-primary/5"
          onClick={() => printDocument(domId, `Receipt ${receipt.serial}`)}
        >
          <Printer className="w-3.5 h-3.5 mr-1.5" /> Print / download
        </Button>
      </div>
    </div>
  );
};
