import { useEffect, useState } from "react";
import { Calculator, X, Sparkles, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIChatWidget } from "@/components/AIChatWidget";
import { supabase } from "@/integrations/supabase/client";

export const StudentTools = ({ studentId }: { studentId?: string | null }) => {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [calculatorEnabled, setCalculatorEnabled] = useState(true);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (!studentId) return;
    (supabase as any).from("student_feature_settings")
      .select("ai_tutor_enabled,calculator_enabled")
      .eq("student_id", studentId)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setAiEnabled(Boolean(data.ai_tutor_enabled));
          setCalculatorEnabled(Boolean(data.calculator_enabled));
        }
      });
  }, [studentId]);

  const calculate = () => {
    if (!/^[0-9+\-*/().%\s]+$/.test(value)) {
      setAnswer("Use numbers and + − × ÷ only.");
      return;
    }
    try {
      const result = Function("return (" + value + ")")();
      setAnswer(Number.isFinite(result) ? String(result) : "Check the expression.");
    } catch {
      setAnswer("Check the expression and try again.");
    }
  };

  return <>
    {(aiEnabled || calculatorEnabled) && (
      <div className="fixed bottom-24 right-4 z-40 hidden items-center gap-2 rounded-[24px] border border-white/50 bg-card/85 p-2 shadow-2xl backdrop-blur-2xl md:flex">
        {aiEnabled && <div className="flex items-center gap-2 rounded-2xl bg-primary/10 px-3 py-2 text-xs font-extrabold text-primary"><Brain className="h-4 w-4" /> AI Tutor ready</div>}
        {calculatorEnabled && <button onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-primary/30" aria-label="Open calculator"><Calculator className="h-5 w-5"/></button>}
      </div>
    )}
    {aiEnabled && <AIChatWidget />}
    {open && calculatorEnabled && (
      <div className="fixed inset-0 z-[70] grid place-items-center bg-[hsl(var(--navy)/.45)] p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
        <Card className="w-full max-w-sm overflow-hidden rounded-[30px] border-white/50 shadow-2xl" onClick={e => e.stopPropagation()}>
          <CardHeader className="bg-gradient-to-br from-primary/15 to-accent/15 flex flex-row items-center justify-between">
            <CardTitle className="portal-display flex items-center gap-2"><Calculator className="h-5 w-5 text-primary"/>Study calculator</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="h-4 w-4"/></Button>
          </CardHeader>
          <CardContent className="space-y-3 p-5">
            <Input value={value} onChange={e=>setValue(e.target.value)} onKeyDown={e=>e.key==="Enter"&&calculate()} placeholder="e.g. 45 × 12" inputMode="decimal" className="h-12 rounded-2xl text-base"/>
            <Button onClick={calculate} className="h-12 w-full rounded-2xl">Calculate</Button>
            {answer && <div className="rounded-2xl bg-muted p-4 text-center text-2xl font-black">{answer}</div>}
          </CardContent>
        </Card>
      </div>
    )}
  </>;
};
