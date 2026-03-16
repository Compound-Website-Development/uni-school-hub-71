import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Apply from "./pages/Apply";
import ResetPassword from "./pages/ResetPassword";
// Student
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentGrades from "./pages/student/StudentGrades";
import StudentReports from "./pages/student/StudentReports";
import StudentTranscript from "./pages/student/StudentTranscript";
import StudentSchedule from "./pages/student/StudentSchedule";
import StudentSettings from "./pages/student/StudentSettings";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentFees from "./pages/student/StudentFees";
import StudentAnnouncements from "./pages/student/StudentAnnouncements";
import StudentExams from "./pages/student/StudentExams";
import TakeExam from "./pages/student/TakeExam";
import StudentHomework from "./pages/student/StudentHomework";
import StudentLibrary from "./pages/student/StudentLibrary";
import StudentCalendar from "./pages/student/StudentCalendar";
import StudentComplaints from "./pages/student/StudentComplaints";
// Staff
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffGradebook from "./pages/staff/StaffGradebook";
import StaffAdmissions from "./pages/staff/StaffAdmissions";
import StaffStudents from "./pages/staff/StaffStudents";
import StaffAttendance from "./pages/staff/StaffAttendance";
import StaffClasses from "./pages/staff/StaffClasses";
import StaffReports from "./pages/staff/StaffReports";
import StaffCBT from "./pages/staff/StaffCBT";
import StaffProfile from "./pages/staff/StaffProfile";
import StaffAssignments from "./pages/staff/StaffAssignments";
import StaffLessonPlans from "./pages/staff/StaffLessonPlans";
import StaffMessages from "./pages/staff/StaffMessages";
import StaffForum from "./pages/staff/StaffForum";
import StaffLeave from "./pages/staff/StaffLeave";
import AdminStudentUpload from "./pages/staff/AdminStudentUpload";
import AdminUsers from "./pages/staff/AdminUsers";
// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminActivityLogs from "./pages/admin/AdminActivityLogs";
import AdminStudentsPage from "./pages/admin/AdminStudentsPage";
import AdminStaffPage from "./pages/admin/AdminStaffPage";
import AdminAnnouncementsPage from "./pages/admin/AdminAnnouncementsPage";
import AdminFeesPage from "./pages/admin/AdminFeesPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminApprovalsPage from "./pages/admin/AdminApprovalsPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminLibrary from "./pages/admin/AdminLibrary";
import AdminTransport from "./pages/admin/AdminTransport";
import AdminVisitors from "./pages/admin/AdminVisitors";
import AdminIDCards from "./pages/admin/AdminIDCards";
import AdminCertificates from "./pages/admin/AdminCertificates";
import AdminComplaints from "./pages/admin/AdminComplaints";
import AdminPredictiveAnalytics from "./pages/admin/AdminPredictiveAnalytics";
import AdminBehavioral from "./pages/admin/AdminBehavioral";
import AdminWellbeing from "./pages/admin/AdminWellbeing";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminSubstitutions from "./pages/admin/AdminSubstitutions";
import StudentResources from "./pages/student/StudentResources";
// Parent
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentGrades from "./pages/parent/ParentGrades";
import ParentAttendance from "./pages/parent/ParentAttendance";
import ParentFees from "./pages/parent/ParentFees";
import ParentMessages from "./pages/parent/ParentMessages";
import ParentForum from "./pages/parent/ParentForum";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Student Portal */}
            <Route path="/student" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/grades" element={<ProtectedRoute allowedRoles={["student"]}><StudentGrades /></ProtectedRoute>} />
            <Route path="/student/reports" element={<ProtectedRoute allowedRoles={["student"]}><StudentReports /></ProtectedRoute>} />
            <Route path="/student/transcript" element={<ProtectedRoute allowedRoles={["student"]}><StudentTranscript /></ProtectedRoute>} />
            <Route path="/student/schedule" element={<ProtectedRoute allowedRoles={["student"]}><StudentSchedule /></ProtectedRoute>} />
            <Route path="/student/settings" element={<ProtectedRoute allowedRoles={["student"]}><StudentSettings /></ProtectedRoute>} />
            <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={["student"]}><StudentAttendance /></ProtectedRoute>} />
            <Route path="/student/fees" element={<ProtectedRoute allowedRoles={["student"]}><StudentFees /></ProtectedRoute>} />
            <Route path="/student/announcements" element={<ProtectedRoute allowedRoles={["student"]}><StudentAnnouncements /></ProtectedRoute>} />
            <Route path="/student/exams" element={<ProtectedRoute allowedRoles={["student"]}><StudentExams /></ProtectedRoute>} />
            <Route path="/student/exams/:id" element={<ProtectedRoute allowedRoles={["student"]}><TakeExam /></ProtectedRoute>} />
            <Route path="/student/homework" element={<ProtectedRoute allowedRoles={["student"]}><StudentHomework /></ProtectedRoute>} />
            <Route path="/student/library" element={<ProtectedRoute allowedRoles={["student"]}><StudentLibrary /></ProtectedRoute>} />
            <Route path="/student/calendar" element={<ProtectedRoute allowedRoles={["student"]}><StudentCalendar /></ProtectedRoute>} />
            <Route path="/student/complaints" element={<ProtectedRoute allowedRoles={["student"]}><StudentComplaints /></ProtectedRoute>} />
            
            {/* Staff Portal */}
            <Route path="/staff" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffDashboard /></ProtectedRoute>} />
            <Route path="/staff/gradebook" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffGradebook /></ProtectedRoute>} />
            <Route path="/staff/admissions" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffAdmissions /></ProtectedRoute>} />
            <Route path="/staff/students" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffStudents /></ProtectedRoute>} />
            <Route path="/staff/attendance" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffAttendance /></ProtectedRoute>} />
            <Route path="/staff/classes" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffClasses /></ProtectedRoute>} />
            <Route path="/staff/reports" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffReports /></ProtectedRoute>} />
            <Route path="/staff/cbt" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffCBT /></ProtectedRoute>} />
            <Route path="/staff/profile" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffProfile /></ProtectedRoute>} />
            <Route path="/staff/assignments" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffAssignments /></ProtectedRoute>} />
            <Route path="/staff/lesson-plans" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffLessonPlans /></ProtectedRoute>} />
            <Route path="/staff/messages" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffMessages /></ProtectedRoute>} />
            <Route path="/staff/forum" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffForum /></ProtectedRoute>} />
            <Route path="/staff/leave" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffLeave /></ProtectedRoute>} />
            <Route path="/staff/admin/students" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStudentUpload /></ProtectedRoute>} />
            <Route path="/staff/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
            
            {/* Admin Portal */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/admin/activity" element={<ProtectedRoute allowedRoles={["admin"]}><AdminActivityLogs /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStudentsPage /></ProtectedRoute>} />
            <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStaffPage /></ProtectedRoute>} />
            <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={["admin"]}><AdminApprovalsPage /></ProtectedRoute>} />
            <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={["admin"]}><AdminFeesPage /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAnnouncementsPage /></ProtectedRoute>} />
            <Route path="/admin/bulk-upload" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStudentUpload /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSettingsPage /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReportsPage /></ProtectedRoute>} />
            <Route path="/admin/library" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLibrary /></ProtectedRoute>} />
            <Route path="/admin/transport" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTransport /></ProtectedRoute>} />
            <Route path="/admin/visitors" element={<ProtectedRoute allowedRoles={["admin"]}><AdminVisitors /></ProtectedRoute>} />
            <Route path="/admin/id-cards" element={<ProtectedRoute allowedRoles={["admin"]}><AdminIDCards /></ProtectedRoute>} />
            <Route path="/admin/certificates" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCertificates /></ProtectedRoute>} />
            <Route path="/admin/complaints" element={<ProtectedRoute allowedRoles={["admin"]}><AdminComplaints /></ProtectedRoute>} />
            <Route path="/admin/predictive" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPredictiveAnalytics /></ProtectedRoute>} />
            <Route path="/admin/behavioral" element={<ProtectedRoute allowedRoles={["admin"]}><AdminBehavioral /></ProtectedRoute>} />
            <Route path="/admin/wellbeing" element={<ProtectedRoute allowedRoles={["admin"]}><AdminWellbeing /></ProtectedRoute>} />
            <Route path="/admin/inventory" element={<ProtectedRoute allowedRoles={["admin"]}><AdminInventory /></ProtectedRoute>} />
            <Route path="/admin/substitutions" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSubstitutions /></ProtectedRoute>} />

            {/* Parent Portal */}
            <Route path="/parent" element={<ProtectedRoute allowedRoles={["parent"]}><ParentDashboard /></ProtectedRoute>} />
            <Route path="/parent/grades" element={<ProtectedRoute allowedRoles={["parent"]}><ParentGrades /></ProtectedRoute>} />
            <Route path="/parent/attendance" element={<ProtectedRoute allowedRoles={["parent"]}><ParentAttendance /></ProtectedRoute>} />
            <Route path="/parent/fees" element={<ProtectedRoute allowedRoles={["parent"]}><ParentFees /></ProtectedRoute>} />
            <Route path="/parent/messages" element={<ProtectedRoute allowedRoles={["parent"]}><ParentMessages /></ProtectedRoute>} />
            <Route path="/parent/forum" element={<ProtectedRoute allowedRoles={["parent"]}><ParentForum /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
