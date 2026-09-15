import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import npsLogo from "@/assets/logo";
import { SCHOOL } from "@/lib/schoolConfig";

/**
 * Entry point for scanned ID-card QR codes (`/s/:token`).
 * Signed-in users land straight in the student portal; everyone else is sent to
 * the login screen. The public verification view stays available at `/p/:token`.
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

  return <Navigate to={user ? "/student" : "/login"} replace />;
};

export default StudentPortalEntry;
