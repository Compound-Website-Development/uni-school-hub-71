import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileText, Users, CreditCard, ClipboardCheck, BarChart2 } from "lucide-react";
import { toast } from "sonner";

const downloadCSV = (data: Record<string, any>[], filename: string) => {
  if (!data.length) { toast.error("No data to export"); return; }
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map(row => headers.map(h => {
      const val = row[h];
      const str = val === null || val === undefined ? "" : String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success(`${filename} downloaded`);
};

const AdminReportsPage = () => {
  const [reportType, setReportType] = useState("students");
  const [isExporting, setIsExporting] = useState(false);
  const [summaryStats, setSummaryStats] = useState({
    students: 0, staff: 0, classes: 0, payments: 0
  });

  useEffect(() => {
    const fetchSummary = async () => {
      const [s, t, c, p] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("teachers").select("id", { count: "exact", head: true }),
        supabase.from("classes").select("id", { count: "exact", head: true }),
        supabase.from("fee_payments").select("id", { count: "exact", head: true }).eq("status", "paid"),
      ]);
      setSummaryStats({
        students: s.count || 0,
        staff: t.count || 0,
        classes: c.count || 0,
        payments: p.count || 0,
      });
    };
    fetchSummary();
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (reportType === "students") {
        const { data } = await supabase.from("students").select("student_id, first_name, last_name, email, phone, gender, status, guardian_name, guardian_phone, admission_date, created_at").order("created_at", { ascending: false });
        downloadCSV(data || [], "students_report.csv");
      } else if (reportType === "staff") {
        const { data } = await supabase.from("teachers").select("employee_id, first_name, last_name, email, phone, department, status, hire_date, created_at").order("created_at", { ascending: false });
        downloadCSV(data || [], "staff_report.csv");
      } else if (reportType === "fees") {
        const { data } = await supabase.from("fee_payments").select("reference, amount_paid, status, payment_method, paid_at, created_at, students(first_name, last_name, student_id), fee_items(name)").order("created_at", { ascending: false });
        const flat = (data || []).map((p: any) => ({
          student_name: `${p.students?.first_name || ""} ${p.students?.last_name || ""}`,
          student_id: p.students?.student_id || "",
          fee_item: p.fee_items?.name || "",
          amount_paid: p.amount_paid,
          status: p.status,
          payment_method: p.payment_method || "",
          reference: p.reference || "",
          paid_at: p.paid_at || "",
          created_at: p.created_at,
        }));
        downloadCSV(flat, "fee_payments_report.csv");
      } else if (reportType === "attendance") {
        const { data } = await supabase.from("attendance").select("date, status, notes, students(first_name, last_name, student_id), classes(name)").order("date", { ascending: false }).limit(1000);
        const flat = (data || []).map((a: any) => ({
          date: a.date,
          student_name: `${a.students?.first_name || ""} ${a.students?.last_name || ""}`,
          student_id: a.students?.student_id || "",
          class: a.classes?.name || "",
          status: a.status,
          notes: a.notes || "",
        }));
        downloadCSV(flat, "attendance_report.csv");
      } else if (reportType === "grades") {
        const { data } = await supabase.from("grades").select("continuous_assessment, exam_score, total_score, letter_grade, remark, status, students(first_name, last_name, student_id), subjects(name), terms(name)").order("created_at", { ascending: false }).limit(1000);
        const flat = (data || []).map((g: any) => ({
          student_name: `${g.students?.first_name || ""} ${g.students?.last_name || ""}`,
          student_id: g.students?.student_id || "",
          subject: g.subjects?.name || "",
          term: g.terms?.name || "",
          ca: g.continuous_assessment,
          exam: g.exam_score,
          total: g.total_score,
          grade: g.letter_grade,
          remark: g.remark,
          status: g.status,
        }));
        downloadCSV(flat, "grades_report.csv");
      }
    } catch (error) {
      toast.error("Export failed");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const reportOptions = [
    { value: "students", label: "Students Report", icon: Users, description: "Export all student records" },
    { value: "staff", label: "Staff Report", icon: Users, description: "Export all staff records" },
    { value: "fees", label: "Fee Payments Report", icon: CreditCard, description: "Export fee payment history" },
    { value: "attendance", label: "Attendance Report", icon: ClipboardCheck, description: "Export attendance records" },
    { value: "grades", label: "Grades Report", icon: FileText, description: "Export all grade records" },
  ];

  const summaryCards = [
    { label: "Total Students", value: summaryStats.students, icon: Users, color: "text-primary bg-primary/10" },
    { label: "Total Staff", value: summaryStats.staff, icon: Users, color: "text-info bg-info/10" },
    { label: "Total Classes", value: summaryStats.classes, icon: BarChart2, color: "text-warning bg-warning/10" },
    { label: "Paid Payments", value: summaryStats.payments, icon: CreditCard, color: "text-success bg-success/10" },
  ];

  return (
    <AdminLayout title="Reports & Export">
      <div className="space-y-6 animate-fade-in max-w-4xl">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Card key={idx} className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{card.value}</p>
                    <p className="text-[11px] text-muted-foreground">{card.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Export Section */}
        <Card className="rounded-xl border-border/50 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Download className="w-4 h-4" /> Export Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-full sm:w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {reportOptions.find(o => o.value === reportType)?.description}
              </p>
            </div>
            <Button onClick={handleExport} disabled={isExporting} className="bg-gradient-primary">
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Download CSV"}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Export Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <Card key={opt.value} className="border-border/50 card-hover-subtle cursor-pointer" onClick={() => { setReportType(opt.value); }}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReportsPage;
