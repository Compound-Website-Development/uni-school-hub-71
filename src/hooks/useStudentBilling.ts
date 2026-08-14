import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BillingBundle {
  invoices: any[];
  lines: Record<string, any[]>;
  receipts: any[];
  terms: any[];
  currentTermId: string | null;
}

const empty: BillingBundle = { invoices: [], lines: {}, receipts: [], terms: [], currentTermId: null };

/** Loads invoices, invoice lines and receipts for one or more pupils. */
export const useStudentBilling = (studentIds: string[]) => {
  const [data, setData] = useState<BillingBundle>(empty);
  const [isLoading, setIsLoading] = useState(true);
  const key = studentIds.slice().sort().join(",");

  const load = useCallback(async () => {
    if (!key) {
      setData(empty);
      setIsLoading(false);
      return;
    }
    const ids = key.split(",");
    const [invRes, recRes, termRes] = await Promise.all([
      supabase.from("invoices").select("*").in("student_id", ids).order("created_at", { ascending: false }),
      supabase.from("receipts").select("*").in("student_id", ids).order("issued_at", { ascending: false }),
      supabase.from("terms").select("id, name, session, is_current").order("term_number"),
    ]);

    const invoices = invRes.data || [];
    let lines: Record<string, any[]> = {};
    if (invoices.length > 0) {
      const { data: lineRows } = await supabase
        .from("invoice_lines")
        .select("*")
        .in("invoice_id", invoices.map((i: any) => i.id));
      lines = (lineRows || []).reduce((acc: Record<string, any[]>, l: any) => {
        (acc[l.invoice_id] = acc[l.invoice_id] || []).push(l);
        return acc;
      }, {});
    }

    const terms = termRes.data || [];
    setData({
      invoices,
      lines,
      receipts: recRes.data || [],
      terms,
      currentTermId: (terms.find((t: any) => t.is_current) as any)?.id ?? null,
    });
    setIsLoading(false);
  }, [key]);

  useEffect(() => { load(); }, [load]);

  return { ...data, isLoading, refresh: load };
};
