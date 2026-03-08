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
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffGradebook from "./pages/staff/StaffGradebook";
import StaffAdmissions from "./pages/staff/StaffAdmissions";
import StaffStudents from "./pages/staff/StaffStudents";
import StaffAttendance from "./pages/staff/StaffAttendance";
import StaffClasses from "./pages/staff/StaffClasses";
import StaffReports from "./pages/staff/StaffReports";
import StaffCBT from "./pages/staff/StaffCBT";
import AdminStudentUpload from "./pages/staff/AdminStudentUpload";
import AdminUsers from "./pages/staff/AdminUsers";
// Superadmin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminActivityLogs from "./pages/admin/AdminActivityLogs";
import AdminStudentsPage from "./pages/admin/AdminStudentsPage";
import AdminStaffPage from "./pages/admin/AdminStaffPage";
import AdminAnnouncementsPage from "./pages/admin/AdminAnnouncementsPage";
import AdminFeesPage from "./pages/admin/AdminFeesPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminApprovalsPage from "./pages/admin/AdminApprovalsPage";
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
            
            {/* Staff Portal */}
            <Route path="/staff" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffDashboard /></ProtectedRoute>} />
            <Route path="/staff/gradebook" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffGradebook /></ProtectedRoute>} />
            <Route path="/staff/admissions" element={<ProtectedRoute allowedRoles={["admin"]}><StaffAdmissions /></ProtectedRoute>} />
            <Route path="/staff/students" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffStudents /></ProtectedRoute>} />
            <Route path="/staff/attendance" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffAttendance /></ProtectedRoute>} />
            <Route path="/staff/classes" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffClasses /></ProtectedRoute>} />
            <Route path="/staff/reports" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffReports /></ProtectedRoute>} />
            <Route path="/staff/cbt" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><StaffCBT /></ProtectedRoute>} />
            <Route path="/staff/admin/students" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStudentUpload /></ProtectedRoute>} />
            <Route path="/staff/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
            
            {/* Superadmin Portal */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/admin/activity" element={<ProtectedRoute allowedRoles={["admin"]}><AdminActivityLogs /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStudentsPage /></ProtectedRoute>} />
            <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStaffPage /></ProtectedRoute>} />
            <Route path="/admin/admissions" element={<ProtectedRoute allowedRoles={["admin"]}><StaffAdmissions /></ProtectedRoute>} />
            <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={["admin"]}><AdminApprovalsPage /></ProtectedRoute>} />
            <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={["admin"]}><StaffClasses /></ProtectedRoute>} />
            <Route path="/admin/gradebook" element={<ProtectedRoute allowedRoles={["admin"]}><StaffGradebook /></ProtectedRoute>} />
            <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={["admin"]}><StaffAttendance /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["admin"]}><StaffReports /></ProtectedRoute>} />
            <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={["admin"]}><AdminFeesPage /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAnnouncementsPage /></ProtectedRoute>} />
            <Route path="/admin/bulk-upload" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStudentUpload /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSettingsPage /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
