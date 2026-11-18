import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Mail, MessageCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";

interface Props { child: { first_name: string; last_name: string; student_id?: string; public_token?: string }; }

/** Lets a parent send a child their own pupil link (same as the ID-card QR) by copy, WhatsApp or email. */
export const ChildPhoneShare = ({ child }: Props) => {
  const [open, setOpen] = useState(false);
  const link = child.public_token ? `${window.location.origin}/s/${child.public_token}` : "";
  const msg = `Here is ${child.first_name}'s Imagemakers pupil link: ${link}\nOpen it on ${child.first_name}'s phone. Please keep it private.`;
  const copy = async (text: string, label: string) => { await navigator.clipboard.writeText(text); toast.success(`${label} copied`); };
  return <>
    <Button data-child-share variant="outline" size="sm" className="rounded-full" onClick={() => setOpen(true)} disabled={!link}><Smartphone className="mr-1.5 h-4 w-4" />My child has a phone</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Send {child.first_name} their link</DialogTitle><DialogDescription>It opens {child.first_name}'s pupil view only. You stay signed in here and can still see everything.</DialogDescription></DialogHeader>
        <div className="break-all rounded-xl bg-muted/50 p-3 font-mono text-xs">{link}</div>
        <div className="grid gap-2">
          <Button onClick={() => copy(link, "Link")}><Copy className="mr-2 h-4 w-4" />Copy link</Button>
          <Button variant="outline" asChild><a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" />Send by WhatsApp</a></Button>
          <Button variant="outline" asChild><a href={`mailto:?subject=${encodeURIComponent(`${child.first_name}'s Imagemakers pupil link`)}&body=${encodeURIComponent(msg)}`}><Mail className="mr-2 h-4 w-4" />Send by email</a></Button>
          {child.student_id && <Button variant="ghost" size="sm" onClick={() => copy(child.student_id!, "Admission number")}>Admission no: {child.student_id}</Button>}
        </div>
        <p className="text-[11px] text-muted-foreground">Anyone with this link can open {child.first_name}'s pupil view, just like the ID-card QR code. Only send it to your child.</p>
      </DialogContent>
    </Dialog>
  </>;
};
