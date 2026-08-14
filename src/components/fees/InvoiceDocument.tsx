import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer } from "lucide-react";
import { naira, invoiceStatusLabel, invoiceStatusTone, balanceOf, printDocument } from "@/lib/finance";

interface Props {
  invoice: any;
  lines: any[];
  studentName: string;
  admissionNo?: string | null;
  className?: string | null;
  termName?: string | null;
}

/** Branded, printable term invoice with the discount shown as its own line. */
export const InvoiceDocument = ({ invoice, lines, studentName, admissionNo, className, termName }: Props) => {
  const domId = `invoice-doc-${invoice.id}`;
  const balance = balanceOf(invoice);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 no-print">
        <Badge variant="outline" className={invoiceStatusTone(invoice.status)}>
          {invoiceStatusLabel(invoice.status)}
        </Badge>
        <Button
          size="sm"
          variant="outline"
          className="shadow-sm hover:shadow-md transition-shadow"
          onClick={() => printDocument(domId, `Invoice ${invoice.serial}`)}
        >
          <Printer className="w-4 h-4 mr-1.5" /> Print invoice
        </Button>
      </div>

      <div id={domId} className="rounded-xl border border-border/60 bg-card p-4 sm:p-5">
        <div className="meta flex flex-wrap justify-between gap-4 text-xs sm:text-sm">
          <div>
            <p><strong>Invoice:</strong> {invoice.serial}</p>
            <p><strong>Pupil:</strong> {studentName}</p>
            {admissionNo && <p><strong>Admission no:</strong> {admissionNo}</p>}
          </div>
          <div className="sm:text-right">
            {className && <p><strong>Class:</strong> {className}</p>}
            {termName && <p><strong>Term:</strong> {termName}</p>}
            {invoice.due_date && (
              <p><strong>Due:</strong> {new Date(invoice.due_date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</p>
            )}
          </div>
        </div>

        <table className="w-full mt-4 text-sm">
          <thead>
            <tr>
              <th className="text-left text-[11px] uppercase tracking-wide text-muted-foreground pb-2">Description</th>
              <th className="num text-right text-[11px] uppercase tracking-wide text-muted-foreground pb-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className="border-t border-border/50">
                <td className="py-2">{l.description}</td>
                <td className="num py-2 text-right">{naira(l.amount)}</td>
              </tr>
            ))}
            {lines.length === 0 && (
              <tr><td colSpan={2} className="py-4 text-center text-muted-foreground">No fee lines on this invoice.</td></tr>
            )}
            <tr className="border-t border-border/60">
              <td className="py-2">Subtotal</td>
              <td className="num py-2 text-right">{naira(invoice.subtotal)}</td>
            </tr>
            {Number(invoice.discount_total) > 0 && (
              <tr>
                <td className="py-2 text-success">Discount / scholarship</td>
                <td className="num py-2 text-right text-success">- {naira(invoice.discount_total)}</td>
              </tr>
            )}
            <tr className="totals border-t border-border/60">
              <td className="py-2 font-semibold">Total payable</td>
              <td className="num py-2 text-right font-semibold">{naira(invoice.total)}</td>
            </tr>
            <tr>
              <td className="py-2">Paid to date</td>
              <td className="num py-2 text-right">{naira(invoice.amount_paid)}</td>
            </tr>
            <tr className="totals">
              <td className="py-2 font-bold">Balance</td>
              <td className={`num py-2 text-right font-bold ${balance > 0 ? "text-destructive" : "text-success"}`}>{naira(balance)}</td>
            </tr>
          </tbody>
        </table>

        <div className="stamp mt-6 flex justify-between text-[11px] text-muted-foreground">
          <span>Bursar's signature: ____________________</span>
          <span>Date: ____________________</span>
        </div>
      </div>
    </div>
  );
};
