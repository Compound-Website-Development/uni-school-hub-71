import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import npsLogo from "@/assets/logo";
import { SCHOOL } from "@/lib/schoolConfig";
import PublicStudentProfile from "./PublicStudentProfile";

/**
 * Entry point for scanned ID-card QR codes (`/s/:token`).
 * Signed-in pupils land straight in the student portal. Signed-out scans stay
 * on the verified public profile so an ID card can be checked without a login.
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <img src={npsLogo} alt={SCHOOL.name} className="h-14 w-auto" />
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Opening the student portal…</p>
      </div>
    );
  }

  if (!user) return <PublicStudentProfile />;

  // Admin and staff accounts may not have a linked pupil record. Do not send
  // those accounts into a pupil dashboard that has no student identity to load.
  return <Navigate to="/student" replace />;
};

export default StudentPortalEntry;
