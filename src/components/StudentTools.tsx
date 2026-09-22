import { useEffect, useState } from "react";
import { Calculator, X, Brain } from "lucide-react";
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

  useEffect(() => {
    const openCalculator = () => {
      if (calculatorEnabled) setOpen(true);
    };
    window.addEventListener("imagemakers-open-calculator", openCalculator);
    return () => window.removeEventListener("imagemakers-open-calculator", openCalculator);
  }, [calculatorEnabled]);

  const calculate = () => {
    const normalized = value.replaceAll("×", "*").replaceAll("÷", "/").replaceAll("−", "-");
    if (!/^[0-9+\-*/().%\s]+$/.test(normalized)) {
      setAnswer("Use numbers and + − × ÷ only.");
      return;
    }
    try {
      const result = Function("return (" + normalized + ")")();
      setAnswer(Number.isFinite(result) ? String(result) : "Check the expression.");
    } catch {
      setAnswer("Check the expression and try again.");
    }
  };

  return <>
    {aiEnabled && <AIChatWidget />}
    {calculatorEnabled && (
      <div className="fixed bottom-5 right-5 z-40 hidden md:block">
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-full border border-border bg-white/90 px-3 py-2 text-xs font-extrabold text-[#416b52] shadow-xl backdrop-blur-xl transition hover:-translate-y-0.5" aria-label="Open calculator">
          <Calculator className="h-4 w-4" /> Calculator
        </button>
      </div>
    )}
    {open && calculatorEnabled && (
      <div className="fixed inset-0 z-[70] grid place-items-center bg-[hsl(var(--navy)/.45)] p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
        <Card className="w-full max-w-sm overflow-hidden rounded-[28px] border-border shadow-2xl" onClick={e => e.stopPropagation()}>
          <CardHeader className="flex flex-row items-center justify-between bg-[#eef3ef]">
            <CardTitle className="flex items-center gap-2 text-[#2e4435]"><Calculator className="h-5 w-5 text-[#4f8063]"/>Study calculator</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="h-4 w-4"/></Button>
          </CardHeader>
          <CardContent className="space-y-3 p-5">
            <Input value={value} onChange={e=>setValue(e.target.value)} onKeyDown={e=>e.key==="Enter"&&calculate()} placeholder="e.g. 45 × 12" inputMode="decimal" className="h-12 rounded-2xl text-base"/>
            <Button onClick={calculate} className="h-12 w-full rounded-2xl bg-[#4f8063] hover:bg-[#416b52]">Calculate</Button>
            {answer && <div className="rounded-2xl bg-[#f5f6f3] p-4 text-center text-2xl font-black text-[#2e4435]">{answer}</div>}
          </CardContent>
        </Card>
      </div>
    )}
  </>;
};
