import { Navigate, useParams } from "react-router-dom";
import PublicStudentProfile from "./PublicStudentProfile";

/**
 * Entry point for scanned ID-card QR codes (`/s/:token`).
 * A scan always opens the verified public profile, regardless of whether the
 * browser already has an admin, staff, parent, or pupil session.
 * The `/p/:token` route remains available as a direct public-profile alias.
 */
const StudentPortalEntry = () => {
  const { token } = useParams();

  if (!token) return <Navigate to="/login" replace />;

  return <PublicStudentProfile />;
};

export default StudentPortalEntry;
