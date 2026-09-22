import { Navigate, useParams } from "react-router-dom";
import StudentDashboard from "./student/StudentDashboard";

/**
 * Entry point for scanned ID-card QR codes (`/s/:token`).
 * A scan opens the student dashboard in token-backed preview mode.
 * The token is passed to the dashboard so the scanned student's name and data load.
 */
const StudentPortalEntry = () => {
  const { token } = useParams();

  if (!token) return <Navigate to="/login" replace />;

  return <StudentDashboard scannedToken={token} />;
};

export default StudentPortalEntry;
