import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";

interface Props {
  classId?: string | null;
  className?: string | null;
  title?: string;
}

/** Shows the approved term fee breakdown for a class (tuition, PTA, party, lesson). */
export const FeeSchedule = ({ classId, className, title = "Term fee schedule" }: Props) => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      const { data } = await supabase
        .from("fee_items")
        .select("id, name, amount")
        .eq("class_id", classId)
        .order("amount", { ascending: false });
      setItems(data || []);
    };
    load();
  }, [classId]);

  if (!classId || items.length === 0) return null;

  const total = items.reduce((sum, i) => sum + Number(i.amount || 0), 0);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          {title}
          {className && <span className="text-xs font-normal text-muted-foreground">— {className}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((i) => (
          <div key={i.id} className="flex items-center justify-between text-sm">
            <span>{i.name}</span>
            <span className="font-medium">₦{Number(i.amount).toLocaleString()}</span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-border/60 pt-2 text-sm font-semibold">
          <span>Total per term</span>
          <span>₦{total.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};
