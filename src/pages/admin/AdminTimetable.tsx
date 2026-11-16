import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAssignedClass } from "@/hooks/useAssignedClass";
import { TimetableEditor } from "@/components/timetable/TimetableEditor";

const AdminTimetable = () => {
  const isAdmin = useLocation().pathname.startsWith("/admin");
  const Layout = isAdmin ? AdminLayout : StaffLayout;
  const { assignedClass, isLoading } = useAssignedClass();
  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("classes").select("id,name").order("name").then(({ data }) => { setClasses(data || []); if (data?.[0]) setClassId((v) => v || data[0].id); });
  }, [isAdmin]);
  const activeId = isAdmin ? classId : assignedClass?.id || "";
  return (
    <Layout title="Class Timetable">
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>Class timetable</CardTitle><p className="mt-1 text-sm text-muted-foreground">Add periods day by day. Pupils and parents see the saved timetable on their phones.</p></div>
          {isAdmin ? <Select value={classId} onValueChange={setClassId}><SelectTrigger className="sm:w-60"><SelectValue placeholder="Choose class" /></SelectTrigger><SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
            : assignedClass && <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">{assignedClass.name}</span>}
        </CardHeader>
        <CardContent>
          {activeId ? <TimetableEditor classId={activeId} /> : <p className="text-sm text-muted-foreground">{isLoading ? "Loading…" : "No class is assigned to you yet. Ask the admin to assign your class."}</p>}
        </CardContent>
      </Card>
    </Layout>
  );
};
export default AdminTimetable;
