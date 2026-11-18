import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check, X, Clock, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";

interface ClassData {
  id: string;
  name: string;
  grade_level: number;
  school_type: string | null;
}

interface StudentData {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
}

interface AttendanceRecord {
  student_id: string;
  status: "present" | "absent" | "late" | "excused";
}

interface ScheduleData {
  class_id: string;
  class_name: string;
  subject_name: string;
  start_time: string;
  end_time: string;
}

const StaffAttendance = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleData[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSchoolType, setSelectedSchoolType] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord["status"]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { userRole, teacherData, user, isShadowIdentity } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const [editedStudents, setEditedStudents] = useState<string[]>([]);
  const [searchParams] = useSearchParams();

  // Fetch classes and today's schedule
  useEffect(() => {
    const fetchInitialData = async () => {
      let classQuery = supabase
          .from("classes")
          .select("id, name, grade_level, school_type")
          .order("grade_level");
      let allowedClassIds: string[] | null = null;

      if (isShadowIdentity || (userRole !== "admin" && teacherData?.id)) {
        // The admin preview adopts only the selected class-teacher's register scope.
        // A preview without a resolved teacher sees no classes.
        if (teacherData?.id) {
          const { data: assigned } = await supabase
            .from("classes")
            .select("id")
            .eq("class_teacher_id", teacherData.id);
          allowedClassIds = (assigned || []).map((row) => row.id);
        } else {
          allowedClassIds = [];
        }
        classQuery = allowedClassIds.length
          ? classQuery.in("id", allowedClassIds)
          : classQuery.in("id", ["00000000-0000-0000-0000-000000000000"]);
      }

      const [classesRes, scheduleRes] = await Promise.all([
        classQuery,
        supabase
          .from("schedules")
          .select(`
            class_id,
            start_time,
            end_time,
            classes (name),
            subjects (name)
          `)
          .eq("day_of_week", new Date().getDay())
          .order("start_time"),
      ]);

      if (classesRes.data) {
        setClasses(classesRes.data);
        const requestedClass = searchParams.get("class");
        const initialClass = classesRes.data.find((cls) => cls.id === requestedClass) ||
          (userRole !== "admin" && classesRes.data.length === 1 ? classesRes.data[0] : null);
        if (initialClass) {
          setSelectedClass(initialClass.id);
          setSelectedSchoolType(initialClass.school_type || "");
        }
      }
      
      if (scheduleRes.data) {
        const visibleSchedule = allowedClassIds
          ? scheduleRes.data.filter((schedule: any) => allowedClassIds?.includes(schedule.class_id))
          : scheduleRes.data;
        setTodaySchedule(visibleSchedule.map((s: any) => ({
          class_id: s.class_id,
          class_name: s.classes?.name || "Unknown",
          subject_name: s.subjects?.name || "Unknown",
          start_time: s.start_time?.slice(0, 5) || "",
          end_time: s.end_time?.slice(0, 5) || "",
        })));
      }
    };

    fetchInitialData();
  }, [searchParams, teacherData?.id, userRole, isShadowIdentity]);

  // Filter classes by school type
  const filteredClasses = selectedSchoolType
    ? classes.filter(c => c.school_type === selectedSchoolType)
    : classes;

  // Fetch students when class is selected
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setAttendance({});
      return;
    }

    const fetchStudentsAndAttendance = async () => {
      setIsLoading(true);

      // Fetch students in the class
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("id, first_name, last_name, student_id")
        .eq("class_id", selectedClass)
        .eq("status", "active")
        .order("last_name");

      if (studentError) {
        console.error("Error fetching students:", studentError);
        setIsLoading(false);
        return;
      }

      setStudents(studentData || []);

      // Fetch existing attendance for the date
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select("student_id, status, edited")
        .eq("class_id", selectedClass)
        .eq("date", selectedDate);

      if (attendanceError) {
        console.error("Error fetching attendance:", attendanceError);
      }

      // Build attendance map
      const attendanceMap: Record<string, AttendanceRecord["status"]> = {};
      const editedIds: string[] = [];
      attendanceData?.forEach((record: any) => {
        attendanceMap[record.student_id] = record.status as AttendanceRecord["status"];
        if (record.edited) editedIds.push(record.student_id);
      });

      setAttendance(attendanceMap);
      setEditedStudents(editedIds);
      setIsLoading(false);
    };

    fetchStudentsAndAttendance();
  }, [selectedClass, selectedDate]);

  const handleStatusChange = (studentId: string, status: AttendanceRecord["status"]) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const markAllPresent = () => {
    const newAttendance: Record<string, AttendanceRecord["status"]> = {};
    students.forEach((student) => {
      newAttendance[student.id] = "present";
    });
    setAttendance(newAttendance);
  };

  const saveAttendance = async () => {
    if (isShadowIdentity) {
      toast({ title: "Read-only preview", description: "Attendance cannot be changed from an admin preview.", variant: "destructive" });
      return;
    }
    if (selectedDate > today) {
      toast({ title: "Future attendance is not allowed", description: "Choose today or an earlier date.", variant: "destructive" });
      return;
    }
    if (!selectedClass || Object.keys(attendance).length === 0) {
      toast({
        title: "Error",
        description: "Please select a class and mark attendance",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: existingRows, error: readError } = await supabase
        .from("attendance")
        .select("id, student_id, status")
        .eq("class_id", selectedClass)
        .eq("date", selectedDate);
      if (readError) throw readError;

      const existingByStudent = new Map((existingRows || []).map((row: any) => [row.student_id, row]));
      const toInsert: any[] = [];
      const toUpdate: Array<{ id: string; status: AttendanceRecord["status"]; studentId: string }> = [];

      for (const [studentId, status] of Object.entries(attendance)) {
        const existing = existingByStudent.get(studentId) as any;
        if (!existing) {
          toInsert.push({
            student_id: studentId,
            class_id: selectedClass,
            date: selectedDate,
            status,
            marked_by: teacherData?.id || null,
            edited: false,
          });
        } else if (existing.status !== status) {
          toUpdate.push({ id: existing.id, status, studentId });
        }
      }

      const now = new Date().toISOString();
      const updateResults = await Promise.all(toUpdate.map(({ id, status }) =>
        supabase.from("attendance").update({
          status,
          marked_by: teacherData?.id || null,
          edited: true,
          updated_by: user?.id || null,
          updated_at: now,
        }).eq("id", id)
      ));
      const updateError = updateResults.find((result) => result.error)?.error;
      if (updateError) throw updateError;

      if (toInsert.length) {
        const { error } = await supabase.from("attendance").insert(toInsert);
        if (error) throw error;
      }

      setEditedStudents((current) => Array.from(new Set([...current, ...toUpdate.map((row) => row.studentId)])));
      toast({
        title: "Success",
        description: toUpdate.length
          ? `Attendance saved. ${toUpdate.length} existing record(s) were marked as edited.`
          : "Attendance saved successfully",
      });
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save attendance",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "present":
        return <Badge className="bg-success text-success-foreground">Present</Badge>;
      case "absent":
        return <Badge variant="destructive">Absent</Badge>;
      case "late":
        return <Badge className="bg-warning text-warning-foreground">Late</Badge>;
      case "excused":
        return <Badge variant="secondary">Excused</Badge>;
      default:
        return <Badge variant="outline">Not Marked</Badge>;
    }
  };

  const stats = {
    total: students.length,
    present: Object.values(attendance).filter((s) => s === "present").length,
    absent: Object.values(attendance).filter((s) => s === "absent").length,
    late: Object.values(attendance).filter((s) => s === "late").length,
    excused: Object.values(attendance).filter((s) => s === "excused").length,
  };

  return (
    <StaffLayout title="Attendance">
      <div className="staff-tool-page staff-attendance-page space-y-6">
        {isShadowIdentity && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            Read-only admin preview. The selected teacher's class register can be inspected, but no attendance changes can be saved.
          </div>
        )}
        {/* Today's Schedule Quick Select */}
        {todaySchedule.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Today's Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {todaySchedule.map((schedule, idx) => (
                  <Button
                    key={idx}
                    variant={selectedClass === schedule.class_id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const cls = classes.find(c => c.id === schedule.class_id);
                      if (cls) {
                        setSelectedSchoolType(cls.school_type || "");
                        setSelectedClass(schedule.class_id);
                      }
                    }}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {schedule.start_time} - {schedule.class_name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  School
                </label>
                <Select value={selectedSchoolType} onValueChange={(v) => {
                  setSelectedSchoolType(v);
                  setSelectedClass("");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...new Set(classes.map((cls) => cls.school_type).filter(Boolean))].map((type) => (
                      <SelectItem key={type} value={type as string}>{String(type).replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Class
                </label>
                <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!classes.length}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    max={today}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value <= today ? e.target.value : today)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        {selectedClass && students.length > 0 && (
          <div className="grid grid-cols-5 gap-2 md:gap-4">
            <Card>
              <CardContent className="px-1 py-3 md:pt-4 text-center">
                <p className="text-lg md:text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-[11px] md:text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-1 py-3 md:pt-4 text-center">
                <p className="text-lg md:text-2xl font-bold text-success">{stats.present}</p>
                <p className="text-[11px] md:text-sm text-muted-foreground">Present</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-1 py-3 md:pt-4 text-center">
                <p className="text-lg md:text-2xl font-bold text-destructive">{stats.absent}</p>
                <p className="text-[11px] md:text-sm text-muted-foreground">Absent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-1 py-3 md:pt-4 text-center">
                <p className="text-lg md:text-2xl font-bold text-warning">{stats.late}</p>
                <p className="text-[11px] md:text-sm text-muted-foreground">Late</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-1 py-3 md:pt-4 text-center">
                <p className="text-lg md:text-2xl font-bold text-muted-foreground">{stats.excused}</p>
                <p className="text-[11px] md:text-sm text-muted-foreground">Excused</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attendance List */}
        {selectedClass && (
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Student Attendance</CardTitle>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Button variant="outline" size="sm" className="h-11 sm:h-9" onClick={markAllPresent} disabled={isShadowIdentity}>
                  <Check className="w-4 h-4 mr-2" />
                  All Present
                </Button>
                <Button className="h-11 sm:h-9" onClick={saveAttendance} disabled={isSaving || isShadowIdentity}>
                  {isSaving ? "Saving..." : "Save Attendance"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading students...
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No students found in this class
                </div>
              ) : (
                <div className="space-y-3">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex flex-col gap-3 p-3 sm:p-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {student.student_id}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2 sm:justify-end">
                        {getStatusBadge(attendance[student.id])}
                        {editedStudents.includes(student.id) && <Badge variant="outline">Edited</Badge>}
                        <div className="flex gap-1">
                          <Button
                            variant={attendance[student.id] === "present" ? "default" : "outline"}
                            size="icon"
                            className="h-10 w-10 sm:h-8 sm:w-8"
                            disabled={isShadowIdentity}
                            onClick={() => handleStatusChange(student.id, "present")}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={attendance[student.id] === "absent" ? "destructive" : "outline"}
                            size="icon"
                            className="h-10 w-10 sm:h-8 sm:w-8"
                            disabled={isShadowIdentity}
                            onClick={() => handleStatusChange(student.id, "absent")}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={attendance[student.id] === "late" ? "secondary" : "outline"}
                            size="icon"
                            className="h-10 w-10 sm:h-8 sm:w-8"
                            disabled={isShadowIdentity}
                            onClick={() => handleStatusChange(student.id, "late")}
                          >
                            <Clock className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={attendance[student.id] === "excused" ? "secondary" : "outline"}
                            size="icon"
                            className="h-10 w-10 sm:h-8 sm:w-8"
                            disabled={isShadowIdentity}
                            onClick={() => handleStatusChange(student.id, "excused")}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedClass && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Select a Class
              </h3>
              <p className="text-muted-foreground">
                Choose a school and class above to start marking attendance
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffAttendance;