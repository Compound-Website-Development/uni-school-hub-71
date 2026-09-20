import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import StudentDashboard from "./student/StudentDashboard";

/**
 * Entry point for scanned ID-card QR codes (`/s/:token`).
 * A scan always opens the verified public profile, regardless of whether the
 * browser already has an admin, staff, parent, or pupil session.
 * The `/p/:token` route remains available as a direct public-profile alias.
 */
const StudentPortalEntry = () => {
  const { token } = useParams();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (token) sessionStorage.setItem("scanned_student_token", token);
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/student" replace />;

  if (!token) return <Navigate to="/login" replace />;

  return <StudentDashboard scannedToken={token} />;
};

export default StudentPortalEntry;
