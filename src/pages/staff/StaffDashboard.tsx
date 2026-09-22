import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { DashboardSkeleton } from "@/components/ui/loading-skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Users, ClipboardCheck, Clock3, ArrowRight, AlertTriangle, TrendingUp, BookOpen, UserPlus } from "lucide-react";
import StaffClockIn from "@/components/StaffClockIn";

interface DashboardStats { totalStudents:number; totalClasses:number; pendingGrades:number; newApplications:number; }
interface UpcomingClass { time:string; className:string; subject:string; room:string|null; }
interface PerformanceMetrics { classesTeaching:number; attendanceMarked:number; gradesEntered:number; lessonPlansCreated:number; }

const StaffDashboard=()=>{
 const {teacherData}=useAuth();
 const [stats,setStats]=useState<DashboardStats|null>(null);
 const [upcomingClasses,setUpcomingClasses]=useState<UpcomingClass[]>([]);
 const [performance,setPerformance]=useState<PerformanceMetrics|null>(null);
 const [isLoading,setIsLoading]=useState(true);
 const currentDate=new Date().toLocaleDateString("en-NG",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
 const userName=teacherData?`${teacherData.first_name} ${teacherData.last_name}`:"Staff Member";

 useEffect(()=>{
  const fetchDashboardData=async()=>{
   try{
    const [studentsRes,classesRes,gradesRes,applicationsRes]=await Promise.all([
      supabase.from("students").select("id",{count:"exact",head:true}).eq("status","active"),
      supabase.from("classes").select("id",{count:"exact",head:true}),
      supabase.from("grades").select("id",{count:"exact",head:true}).eq("status","draft"),
      supabase.from("applications").select("id",{count:"exact",head:true}).eq("status","pending"),
    ]);
    setStats({totalStudents:studentsRes.count||0,totalClasses:classesRes.count||0,pendingGrades:gradesRes.count||0,newApplications:applicationsRes.count||0});
    if(teacherData?.id){
      const [classSubjectsRes,attendanceRes,gradesEnteredRes,lessonPlansRes]=await Promise.all([
        supabase.from("class_subjects").select("id",{count:"exact",head:true}).eq("teacher_id",teacherData.id),
        supabase.from("attendance").select("id",{count:"exact",head:true}).eq("marked_by",teacherData.id),
        supabase.from("grades").select("id",{count:"exact",head:true}).eq("entered_by",teacherData.id),
        supabase.from("lesson_plans").select("id",{count:"exact",head:true}).eq("teacher_id",teacherData.id),
      ]);
      setPerformance({classesTeaching:classSubjectsRes.count||0,attendanceMarked:attendanceRes.count||0,gradesEntered:gradesEnteredRes.count||0,lessonPlansCreated:lessonPlansRes.count||0});
    }
    const {data:scheduleData}=await supabase.from("schedules").select("start_time,end_time,room,classes(name),subjects(name)").eq("day_of_week",new Date().getDay()).order("start_time").limit(5);
    setUpcomingClasses((scheduleData||[]).map((s:any)=>({time:s.start_time?.slice(0,5)||"—",className:s.classes?.name||"Class",subject:s.subjects?.name||"Subject",room:s.room})));
   }catch(error){console.error("Error fetching dashboard data:",error);}
   finally{setIsLoading(false);}
  };
  fetchDashboardData();
 },[teacherData?.id]);

 if(isLoading)return <StaffLayout title="Dashboard"><DashboardSkeleton/></StaffLayout>;

 const workbench=[
  {kind:"attendance",label:"Attendance",note:"Mark your assigned class",href:"/staff/attendance"},
  {kind:"results",label:"Gradebook",note:"Enter and review scores",href:"/staff/gradebook"},
  {kind:"cbt",label:"CBT Studio",note:"Build objective assessments",href:"/staff/cbt"},
  {kind:"messages",label:"Messages",note:"Talk to school administration",href:"/staff/messages"},
 ] as const;

 const attention=[
  stats?.pendingGrades ? {label:`${stats.pendingGrades} draft grade record${stats.pendingGrades===1?"":"s"}`,href:"/staff/gradebook",kind:"Gradebook"} : null,
  stats?.newApplications ? {label:`${stats.newApplications} pending admission application${stats.newApplications===1?"":"s"}`,href:"/staff/admissions",kind:"Admissions"} : null,
 ].filter(Boolean) as {label:string;href:string;kind:string}[];

 return <StaffLayout title="Dashboard">
  <div className="dashboard-surface dashboard-staff space-y-5">
   <section className="portal-hero grid gap-6 md:grid-cols-[1fr_auto]">
    <div className="portal-hero-copy max-w-none">
      <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-[#4f8063]">Staff workspace</p>
      <h1 className="portal-display mt-2 text-4xl font-extrabold leading-[1] text-[#26362b] md:text-6xl">Good day, {userName.split(" ")[0]}.</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{currentDate}. Your dashboard is arranged around the work you actually do: teach, mark attendance, enter results and prepare assessments.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to="/staff/attendance" className="rounded-full bg-[#4f8063] px-4 py-2.5 text-xs font-extrabold text-white">Take attendance</Link>
        <Link to="/staff/gradebook" className="rounded-full border border-border bg-white px-4 py-2.5 text-xs font-extrabold text-[#3e5546]">Open gradebook</Link>
      </div>
    </div>
    <div className="staff-art hidden md:block self-center" aria-hidden="true"><span/><i/><b/></div>
   </section>

   <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    <StatCard icon="group" label="Active Students" value={String(stats?.totalStudents||0)} variant="primary"/>
    <StatCard icon="book" label="Classes" value={String(stats?.totalClasses||0)} variant="success"/>
    <StatCard icon="assignment" label="Draft Grades" value={String(stats?.pendingGrades||0)} variant="warning"/>
    <StatCard icon="person_add" label="Pending Applications" value={String(stats?.newApplications||0)} variant="destructive"/>
   </section>

   <section className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
    <Card className="portal-surface overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#4f8063]">Today</p><CardTitle className="portal-display mt-1 text-2xl font-extrabold">Teaching schedule</CardTitle></div><Clock3 className="h-5 w-5 text-[#7c877f]"/></CardHeader>
      <CardContent>
       {upcomingClasses.length ? <div className="space-y-2">{upcomingClasses.map((item,i)=><div key={`${item.time}-${i}`} className="flex items-center gap-3 rounded-2xl bg-[#f5f6f3] p-3.5"><div className="w-16 shrink-0 text-center"><p className="text-sm font-extrabold text-[#416b52]">{item.time}</p><p className="text-[9px] uppercase tracking-wider text-muted-foreground">start</p></div><div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-[#344239]">{item.className} · {item.subject}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.room||"Classroom"} · timetable entry</p></div></div>)}</div> :
       <div className="rounded-2xl border border-dashed border-[#d7dfd9] p-6"><p className="font-bold text-[#465249]">No timetable entries published today.</p><p className="mt-1 text-xs leading-5 text-muted-foreground">The schedule will appear here when the school adds it.</p></div>}
      </CardContent>
    </Card>

    <div className="space-y-4">
      <StaffClockIn/>
      <Card className="portal-surface">
       <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-[#b56f35]"/>Needs your attention</CardTitle></CardHeader>
       <CardContent>{attention.length ? <div className="space-y-2">{attention.map(item=><Link key={item.kind} to={item.href} className="flex items-center gap-3 rounded-2xl bg-[#fbf5eb] p-3.5 hover:bg-[#f7eddc]"><div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#b56f35]"><ArrowRight className="h-4 w-4"/></div><div className="min-w-0"><p className="text-sm font-bold">{item.label}</p><p className="text-[10px] text-muted-foreground">{item.kind}</p></div></Link>)}</div> : <p className="rounded-2xl bg-[#f5f6f3] p-4 text-sm text-muted-foreground">Nothing is waiting for you right now.</p>}</CardContent>
      </Card>
    </div>
   </section>

   <section className="portal-surface rounded-[26px] p-5 md:p-6">
    <div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#4f8063]">My work</p><h2 className="portal-display mt-1 text-2xl font-extrabold text-[#26362b]">Open a workspace</h2></div><TrendingUp className="h-5 w-5 text-[#7c877f]"/></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {workbench.map(item=><Link key={item.href} to={item.href} className="portal-feature-card group p-4"><div className={`staff-art staff-art-${item.kind}`} aria-hidden="true"><span/><i/><b/></div><p className="portal-display mt-3 text-lg font-extrabold">{item.label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.note}</p><span className="mt-3 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#4f8063]">Open <ArrowRight className="h-3 w-3"/></span></Link>)}
    </div>
   </section>

   {performance && <section className="portal-surface rounded-[26px] p-5 md:p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#4f8063]">Your activity</p><h2 className="portal-display mt-1 text-2xl font-extrabold text-[#26362b]">Work completed</h2></div><BookOpen className="h-5 w-5 text-[#7c877f]"/></div><div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{[{label:"Classes teaching",value:performance.classesTeaching},{label:"Attendance marked",value:performance.attendanceMarked},{label:"Grades entered",value:performance.gradesEntered},{label:"Lesson plans",value:performance.lessonPlansCreated}].map(item=><div key={item.label} className="rounded-2xl bg-[#f5f6f3] p-4"><p className="portal-display text-2xl font-extrabold text-[#26362b]">{item.value}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.label}</p></div>)}</div></section>}
  </div>
 </StaffLayout>;
};
export default StaffDashboard;
