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
    (supabase as any).from("student_feature_settings").select("ai_tutor_enabled,calculator_enabled").eq("student_id", studentId).maybeSingle()
      .then(({ data }) => { if (data) { setAiEnabled(data.ai_tutor_enabled); setCalculatorEnabled(data.calculator_enabled); } });
  }, [studentId]);

  const calculate = () => {
    if (!/^[0-9+\-*/().%\s]+$/.test(value)) { setAnswer("Use numbers and + − × ÷ only."); return; }
    try { setAnswer(String(Function("return (" + value + ")")())); } catch { setAnswer("Check the expression and try again."); }
  };

  return <>
    {(aiEnabled || calculatorEnabled) && <div className="fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-2xl border border-border/60 bg-card/90 p-2 shadow-2xl backdrop-blur-xl animate-fade-in">
      {aiEnabled && <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary"><Sparkles className="h-4 w-4" /> AI Tutor</div>}
      {calculatorEnabled && <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105" aria-label="Calculator"><Calculator className="h-5 w-5" /></button>}
    </div>}
    {aiEnabled && <AIChatWidget />}
    {open && calculatorEnabled && <div className="fixed inset-0 z-[70] grid place-items-center bg-black/30 p-4" onClick={() => setOpen(false)}>
      <Card className="w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> Calculator</CardTitle><Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button></CardHeader>
        <CardContent className="space-y-3"><Input value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === "Enter" && calculate()} placeholder="e.g. 45 * 12" inputMode="decimal" /><Button onClick={calculate} className="w-full">Calculate</Button>{answer && <div className="rounded-xl bg-muted p-3 text-center text-lg font-bold">{answer}</div>}</CardContent>
      </Card>
    </div>}
  </>;
};
