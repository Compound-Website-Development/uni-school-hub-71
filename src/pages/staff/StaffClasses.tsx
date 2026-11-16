import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Users, BookOpen, ClipboardCheck, FileText, GraduationCap, School } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardSkeleton } from "@/components/ui/loading-skeleton";
import { InlineEmptyState } from "@/components/ui/empty-state";

interface ClassRow {
  id: string;
  name: string;
  level: string | null;
  arm: string | null;
  room: string | null;
  capacity: number | null;
  class_teacher_id: string | null;
}

interface StudentRow {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  status: string | null;
}

interface SpecialistRow {
  subject: string;
  teacher: string;
}

const StaffClasses = () => {
  const { user, userRole } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  /** Classes the signed-in staff member is class teacher for (admins: all classes). */
  const [myClasses, setMyClasses] = useState<ClassRow[]>([]);
  const [activeClass, setActiveClass] = useState<ClassRow | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [specialists, setSpecialists] = useState<SpecialistRow[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setIsLoading(true);
      const sb: any = supabase;

      let classRows: ClassRow[] = [];
      if (userRole === "admin") {
        const { data } = await sb
          .from("classes")
          .select("id, name, level, arm, room, capacity, class_teacher_id")
          .order("name");
        classRows = data || [];
      } else {
        const { data: teacher } = await sb
          .from("teachers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (teacher?.id) {
          const { data } = await sb
            .from("classes")
            .select("id, name, level, arm, room, capacity, class_teacher_id")
            .eq("class_teacher_id", teacher.id)
            .order("name");
          classRows = data || [];
        }
      }

      setMyClasses(classRows);
      setActiveClass(classRows[0] ?? null);
      setIsLoading(false);
    };
    load();
  }, [user, userRole]);

  useEffect(() => {
    const loadClassDetail = async () => {
      if (!activeClass) {
        setStudents([]);
        setSpecialists([]);
        return;
      }
      const sb: any = supabase;
      const [{ data: pupils }, { data: links }] = await Promise.all([
        sb
          .from("students")
          .select("id, student_id, first_name, last_name, status")
          .eq("class_id", activeClass.id)
          .order("last_name"),
        sb
          .from("class_subjects")
          .select("teacher_id, subject_id, subjects (name), teachers (first_name, last_name)")
          .eq("class_id", activeClass.id),
      ]);

      setStudents(pupils || []);
       setSpecialists(
        (links || [])
           .filter((l: any) => l.teachers && l.subjects && l.teacher_id !== activeClass.class_teacher_id)
          .map((l: any) => ({
            subject: l.subjects.name,
            teacher: `${l.teachers.first_name} ${l.teachers.last_name}`,
          })),
      );
    };
    loadClassDetail();
  }, [activeClass]);

  if (isLoading) {
    return (
      <StaffLayout title="My Class">
        <DashboardSkeleton />
      </StaffLayout>
    );
  }

  if (!activeClass) {
    return (
      <StaffLayout title="My Class">
        <Card>
          <CardContent className="py-12">
            <InlineEmptyState
              icon={School}
              title="No class assigned yet"
              description="You will see your pupils here once the school assigns you as a class teacher."
            />
          </CardContent>
        </Card>
      </StaffLayout>
    );
  }

  const activePupils = students.filter((s) => (s.status || "active") === "active");

  return (
    <StaffLayout title="My Class">
      <div className="space-y-6">
        {/* Class switcher — only shown when a staff member covers more than one class */}
        {myClasses.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {myClasses.map((c) => (
              <Button
                key={c.id}
                variant={c.id === activeClass.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveClass(c)}
              >
                {c.name}
              </Button>
            ))}
          </div>
        )}

        {/* Class header */}
        <Card className="shadow-elev-1">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">{activeClass.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {[activeClass.level, activeClass.arm && `${activeClass.arm} arm`, activeClass.room && `Room ${activeClass.room}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Users className="w-3.5 h-3.5" />
                {activePupils.length}
                {activeClass.capacity ? ` / ${activeClass.capacity}` : ""} pupils
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-3">
              <Button variant="outline" asChild className="justify-start">
                <Link to={`/staff/attendance?class=${activeClass.id}`}>
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Mark attendance
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link to={`/staff/gradebook?class=${activeClass.id}`}>
                  <FileText className="w-4 h-4 mr-2" />
                  Enter results
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link to="/staff/report-card">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Report cards
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pupils in this class */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              Pupils
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {students.length === 0 ? (
              <div className="p-6">
                <InlineEmptyState
                  icon={Users}
                  title="No pupils in this class yet"
                  description="Pupils appear here as soon as they are enrolled into this class."
                />
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {students.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                      {s.first_name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">
                        {s.first_name} {s.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">{s.student_id}</p>
                    </div>
                    <Badge variant={(s.status || "active") === "active" ? "default" : "secondary"}>
                      {s.status || "active"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Specialist subjects, only where the school has specialist teachers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5 text-primary" />
              Specialist subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {specialists.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No specialist teacher assigned to this class. As class teacher you record results for the normal
                class subjects.
              </p>
            ) : (
              <div className="space-y-2">
                {specialists.map((s, i) => (
                  <div key={`${s.subject}-${i}`} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{s.subject}</span>
                    <span className="text-muted-foreground">{s.teacher}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
};

export default StaffClasses;
