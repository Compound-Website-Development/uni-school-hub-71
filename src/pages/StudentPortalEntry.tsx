import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import StudentDashboard from "./student/StudentDashboard";

/**
 * Entry point for scanned ID-card QR codes (`/s/:token`).
 * A scan always opens the verified public profile, regardless of whether the
 * browser already has an admin, staff, parent, or pupil session.
 * The `/p/:token` route remains available as a direct public-profile alias.
 */
const StudentPortalEntry = () => {
  const { token } = useParams();

  useEffect(() => {
    if (token) sessionStorage.setItem("scanned_student_token", token);
  }, [token]);

  if (!token) return <Navigate to="/login" replace />;

  return <StudentDashboard scannedToken={token} />;
};

export default StudentPortalEntry;
