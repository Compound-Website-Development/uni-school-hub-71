import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Apply from "./pages/Apply";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentGrades from "./pages/student/StudentGrades";
import StudentReports from "./pages/student/StudentReports";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffGradebook from "./pages/staff/StaffGradebook";
import StaffAdmissions from "./pages/staff/StaffAdmissions";
import StaffStudents from "./pages/staff/StaffStudents";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/apply" element={<Apply />} />
          
          {/* Student Portal */}
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/grades" element={<StudentGrades />} />
          <Route path="/student/reports" element={<StudentReports />} />
          
          {/* Staff/Admin Portal */}
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/staff/gradebook" element={<StaffGradebook />} />
          <Route path="/staff/admissions" element={<StaffAdmissions />} />
          <Route path="/staff/students" element={<StaffStudents />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
