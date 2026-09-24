import { useEffect, useState } from "react";
import { Calculator, X, Delete, Equal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIChatWidget } from "@/components/AIChatWidget";
import { supabase } from "@/integrations/supabase/client";

export const StudentTools = ({ studentId }: { studentId?: string | null }) => {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [calculatorEnabled, setCalculatorEnabled] = useState(true);
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [expression, setExpression] = useState("");

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
    const normalized = expression.replaceAll("×", "*").replaceAll("÷", "/").replaceAll("−", "-");
    if (!normalized.trim()) return;
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

  const press = (key: string) => {
    if (key === "C") { setExpression(""); setAnswer(""); return; }
    if (key === "⌫") { setExpression(v => v.slice(0, -1)); return; }
    if (key === "=") { calculate(); return; }
    setExpression(v => v + key);
  };

  return <>
    {aiEnabled && <AIChatWidget />}
    {calculatorEnabled && (
      <div className="fixed bottom-24 right-4 md:bottom-5 md:right-5 z-40">
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-full border border-border bg-white/90 px-3 py-2 text-xs font-extrabold text-[#2578a7] shadow-xl backdrop-blur-xl transition hover:-translate-y-0.5" aria-label="Open calculator">
          <Calculator className="h-4 w-4" /> Calculator
        </button>
      </div>
    )}
    {open && calculatorEnabled && (
      <div className="fixed inset-0 z-[70] grid place-items-center bg-[hsl(var(--navy)/.45)] p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
        <Card className="w-full max-w-sm overflow-hidden rounded-[28px] border-border shadow-2xl" onClick={e => e.stopPropagation()}>
          <CardHeader className="flex flex-row items-center justify-between bg-[#eaf6fb]">
            <CardTitle className="flex items-center gap-2 text-[#17394c]"><Calculator className="h-5 w-5 text-[#2f8fca]"/>Study calculator</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="h-4 w-4"/></Button>
          </CardHeader>
          <CardContent className="space-y-3 p-5">
            <div className="rounded-2xl border border-[#d7e9f4] bg-[#f6fbfe] p-3">
              <p className="min-h-7 text-right text-xs font-semibold text-[#78909d]">{expression || "Ready"}</p>
              <p className="mt-1 min-h-9 text-right text-2xl font-black text-[#17394c]">{answer || "0"}</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {["C","⌫","÷","×","7","8","9","−","4","5","6","+","1","2","3","%","0",".","(",")"].map(key => (
                <button key={key} onClick={() => press(key)} className="h-11 rounded-xl border border-[#d7e9f4] bg-white text-sm font-extrabold text-[#274e63] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#e9f5ff]">
                  {key === "⌫" ? <Delete className="mx-auto h-4 w-4"/> : key}
                </button>
              ))}
              <button onClick={() => press("=")} className="col-span-2 h-11 rounded-xl bg-[#2f8fca] text-sm font-extrabold text-white shadow-sm hover:bg-[#2578a7]"><Equal className="mx-auto h-4 w-4"/></button>
            </div>
            <p className="text-center text-[10px] font-semibold text-[#78909d]">Use this to check your working. Show your method in class.</p>
          </CardContent>
        </Card>
      </div>
    )}
  </>;
};
