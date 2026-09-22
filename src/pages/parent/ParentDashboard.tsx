import { PortalHeroArt } from "@/components/PortalHeroArt";
import { useState, useEffect } from "react";
import { ParentLayout } from "@/components/layout/ParentLayout";
import SchoolInfoPanel from "@/components/SchoolInfoPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  GraduationCap, BookOpen, Calendar, CreditCard, Loader2,
  TrendingUp, Clock, MessageSquare, Bell, ChevronRight, Star,
  ClipboardList, Monitor, AlertTriangle
} from "lucide-react";
import { format, isFuture, isToday, addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { PortalIllustration } from "@/components/PortalIllustration";

const ParentDashboard = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<any[]>([]);
  const [childGrades, setChildGrades] = useState<Record<string, any[]>>({});
  const [childAttendance, setChildAttendance] = useState<Record<string, { present: number; total: number }>>({});
  const [childBalance, setChildBalance] = useState<Record<string, { billed: number; paid: number; discount: number }>>({});
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [upcomingHomework, setUpcomingHomework] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      if (!user) return;
      const { data: links } = await supabase
        .from("parent_student_links")
        .select("student_id")
        .eq("parent_user_id", user.id);

      let studentIds: string[] = (links || []).map((l: any) => l.student_id);

      if (studentIds.length > 0) {

        // Get student class_ids for homework/exam queries
        const [studentsRes, gradesRes, attendanceRes, announcementsRes, invoiceRes, receiptRes, discountRes] = await Promise.all([
          supabase.from("students").select("*").in("id", studentIds),
          supabase.from("grades").select("student_id, total_score, letter_grade, subjects(name)").in("student_id", studentIds),
          supabase.from("attendance").select("student_id, status").in("student_id", studentIds),
          supabase.from("announcements").select("*").eq("is_published", true).order("created_at", { ascending: false }).limit(5),
          supabase.from("invoices").select("id, student_id, subtotal, total, discount_total, term_id").in("student_id", studentIds),
          supabase.from("receipts").select("invoice_id, student_id, amount").in("student_id", studentIds),
          supabase.from("student_discounts").select("student_id, term_id, discount_type, value").in("student_id", studentIds),
        ]);

        const receiptByInvoice = (receiptRes.data || []).reduce<Record<string, number>>((acc, receipt: any) => {
          if (receipt.invoice_id) acc[receipt.invoice_id] = (acc[receipt.invoice_id] || 0) + Number(receipt.amount || 0);
          return acc;
        }, {});
        const balanceMap: Record<string, { billed: number; paid: number; discount: number }> = {};
        (invoiceRes.data || []).forEach((i: any) => {
          const entry = (balanceMap[i.student_id] = balanceMap[i.student_id] || { billed: 0, paid: 0, discount: 0 });
          entry.billed += Number(i.total || 0);
          entry.discount += Number(i.discount_total || 0);
          entry.paid += receiptByInvoice[i.id] || 0;
        });
        (discountRes.data || []).forEach((discount: any) => {
          const entry = balanceMap[discount.student_id];
          if (entry && !entry.discount) entry.discount += Number(discount.value || 0);
        });
        setChildBalance(balanceMap);

        const studentList = studentsRes.data || [];
        setChildren(studentList);
        setRecentAnnouncements(announcementsRes.data || []);

        // Fetch upcoming homework and exams based on children's classes
        const classIds = studentList.map((s: any) => s.class_id).filter(Boolean);
        if (classIds.length > 0) {
          const [hwRes, examRes] = await Promise.all([
            supabase.from("assignments").select("title, due_date, subjects(name)").in("class_id", classIds).gte("due_date", new Date().toISOString()).order("due_date").limit(5),
            supabase.from("exams").select("title, start_time, duration_minutes, subjects(name)").in("class_id", classIds).in("status", ["active", "draft"]).order("start_time").limit(5),
          ]);
          setUpcomingHomework(hwRes.data || []);
          setUpcomingExams(examRes.data || []);
        }

        // Process grades per child
        const gradeMap: Record<string, any[]> = {};
        (gradesRes.data || []).forEach((g: any) => {
          if (!gradeMap[g.student_id]) gradeMap[g.student_id] = [];
          gradeMap[g.student_id].push(g);
        });
        setChildGrades(gradeMap);

        // Process attendance per child
        const attMap: Record<string, { present: number; total: number }> = {};
        studentIds.forEach((sid: string) => {
          const records = (attendanceRes.data || []).filter((a: any) => a.student_id === sid);
          attMap[sid] = {
            total: records.length,
            present: records.filter((a: any) => a.status === "present").length,
          };
        });
        setChildAttendance(attMap);
      }
      setIsLoading(false);
    };
    fetchAll();
  }, [user, userRole]);

  const getAvgGrade = (studentId: string) => {
    const grades = childGrades[studentId] || [];
    if (grades.length === 0) return null;
    return Math.round(grades.reduce((s: number, g: any) => s + Number(g.total_score || 0), 0) / grades.length);
  };

  const getAttendanceRate = (studentId: string) => {
    const att = childAttendance[studentId];
    if (!att || att.total === 0) return null;
    return Math.round((att.present / att.total) * 100);
  };

  if (isLoading) {
    return (
      <ParentLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ParentLayout>
    );
  }

  return (
    <ParentLayout title="Dashboard">
      <div className="dashboard-surface dashboard-parent space-y-6 animate-fade-in">
        <section className="portal-hero">
          <PortalIconArt kind="people" className="portal-hero-art h-full w-[360px] opacity-70" />
          <div className="portal-hero-copy">
            <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-primary">Imagemakers family space</p>
            <h1 className="portal-display mt-2 text-4xl font-extrabold md:text-6xl">Your child&apos;s school life,<br/><span className="text-gradient">without the guesswork.</span></h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">One connected view of results, attendance, assignments, fees, messages and authorised transport. Empty school records stay empty until the school records real data.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/parent/grades" className="rounded-full bg-primary px-4 py-2.5 text-xs font-extrabold text-white">View grades</Link>
              <Link to="/parent/fees" className="rounded-full border border-border bg-card/80 px-4 py-2.5 text-xs font-extrabold">Fee status</Link>
              <Link to="/parent/transport" className="rounded-full border border-border bg-card/80 px-4 py-2.5 text-xs font-extrabold">School bus</Link>
            </div>
          </div>
        </section>

        {isPreview && (
          <div className="border-l-2 border-accent px-3 py-2 text-xs text-muted-foreground">
            Preview identity — this view is showing a pupil record for demonstration, not a linked child.
          </div>
        )}

        {children.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="font-semibold text-foreground mb-2">No Children Linked</h3>
              <p className="text-sm text-muted-foreground">Contact the school administrator to link your child's account.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Child Cards with Stats */}
            {children.map((child) => {
              const avg = getAvgGrade(child.id);
              const att = getAttendanceRate(child.id);
              const balance = childBalance[child.id];
              const outstanding = balance ? Math.max(0, balance.billed - balance.paid) : 0;
              return (
                <Card key={child.id} className="border-border/50 overflow-hidden">
                  <CardHeader className="relative overflow-hidden bg-gradient-to-br from-primary/8 via-card to-accent/8 pb-3">
                    <PortalIconArt kind="profile" className="absolute -right-2 -top-3 h-24 w-24 opacity-35" />
                    <CardTitle className="relative flex items-center gap-3 text-base">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-card shadow-sm"><PortalIllustration kind="profile" size="lg" className="h-10 w-10" /></span>
                      <span><span className="block portal-display text-lg font-extrabold">{child.first_name} {child.last_name}</span><span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Linked child</span></span>
                      <Badge variant="outline" className="ml-auto capitalize text-[10px]">{child.status || "active"}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 rounded-lg bg-muted/30">
                        <Star className="w-4 h-4 mx-auto mb-1 text-accent" />
                        <p className="text-lg font-bold text-foreground">{avg === null ? "—" : `${avg}%`}</p>
                        <p className="text-[10px] text-muted-foreground">Average grade</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/30">
                        <Clock className="w-4 h-4 mx-auto mb-1 text-info" />
                        <p className="text-lg font-bold text-foreground">{att === null ? "—" : `${att}%`}</p>
                        <p className="text-[10px] text-muted-foreground">Attendance</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/30">
                        <BookOpen className="w-4 h-4 mx-auto mb-1 text-success" />
                        <p className="text-lg font-bold text-foreground">{balance ? `₦${outstanding.toLocaleString()}` : "—"}</p>
                        <p className="text-[10px] text-muted-foreground">Outstanding fees</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Academic Performance</span>
                        <span className={`font-semibold ${avg === null ? "text-muted-foreground" : avg >= 60 ? "text-success" : avg >= 40 ? "text-warning" : "text-destructive"}`}>{avg === null ? "No results yet" : avg >= 60 ? "Good" : avg >= 40 ? "Average" : "Needs attention"}</span>
                      </div>
                      <Progress value={avg ?? 0} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{(childGrades[child.id] || []).length ? `${(childGrades[child.id] || []).length} subjects recorded` : "No grades recorded yet"}</span>
                        <span>{balance ? `Billed ₦${balance.billed.toLocaleString()} · Paid ₦${balance.paid.toLocaleString()}` : "No invoices recorded yet"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}

        {/* Upcoming Homework & Exams */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-warning" /> Upcoming Homework
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingHomework.length > 0 ? (
                <div className="space-y-2">
                  {upcomingHomework.map((hw, i) => {
                    const due = new Date(hw.due_date);
                    const isUrgent = due <= addDays(new Date(), 2);
                    return (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                        <div>
                          <p className="text-sm font-medium text-foreground">{hw.title}</p>
                          <p className="text-[10px] text-muted-foreground">{(hw as any).subjects?.name || "General"}</p>
                        </div>
                        <Badge className={`text-[10px] ${isUrgent ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                          {isToday(due) ? "Today" : format(due, "MMM d")}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No upcoming homework</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Monitor className="w-4 h-4 text-info" /> Upcoming Exams
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingExams.length > 0 ? (
                <div className="space-y-2">
                  {upcomingExams.map((exam, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium text-foreground">{exam.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {(exam as any).subjects?.name || "General"} · {exam.duration_minutes}min
                        </p>
                      </div>
                      <Badge className="text-[10px] bg-info/10 text-info border-info/20">
                        {exam.start_time ? format(new Date(exam.start_time), "MMM d") : "TBA"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Monitor className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No upcoming exams</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {kind:"book",label:"Grades",href:"/parent/grades",note:"See published results"},
            {kind:"attendance",label:"Attendance",href:"/parent/attendance",note:"Track school attendance"},
            {kind:"finance",label:"Fees & payments",href:"/parent/fees",note:"Review balances"},
            {kind:"bus",label:"School bus",href:"/parent/transport",note:"Only if authorised"},
          ].map(item=><button key={item.href} onClick={()=>navigate(item.href)} className="portal-feature-card group p-5 text-left">
            <PortalIllustration kind={item.kind as any} size="md" className="h-14 w-14 portal-float-icon" />
            <p className="portal-display mt-5 text-lg font-extrabold">{item.label}</p><p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
            <span className="mt-4 text-[10px] font-extrabold uppercase tracking-wider text-primary">Open →</span>
          </button>)}
        </section>

        {/* Recent Announcements */}
        {recentAnnouncements.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Bell className="w-4 h-4 text-accent" /> Recent Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAnnouncements.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">{a.title}</p>
                      {a.priority === "high" && <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">Important</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{a.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{a.created_at ? format(new Date(a.created_at), "MMM d, yyyy") : ""}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        <SchoolInfoPanel sections={["school", "terms", "grading", "classes"]} />
      </div>
    </ParentLayout>
  );
};

export default ParentDashboard;
