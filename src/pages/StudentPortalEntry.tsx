import { Navigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StudentDashboard from "./student/StudentDashboard";

/**
 * Entry point for scanned ID-card QR codes (`/s/:token`).
 * A scan opens the student dashboard in token-backed preview mode.
 * The token is passed to the dashboard so the scanned student's name and data load.
 */
const StudentPortalEntry = () => {
  const { token } = useParams();

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const authenticate = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        if (!cancelled) setStatus("ready");
        return;
      }

      const { data, error } = await supabase.functions.invoke("qr-student-login", {
        body: { token },
      });
      if (error || !data?.token_hash) {
        if (!cancelled) setStatus("error");
        return;
      }

      // verifyOtp returns the authenticated session. Explicitly restore it before
      // rendering the protected student portal so navigation cannot race AuthProvider.
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink",
      });
      if (verifyError || !verifyData.session) {
        if (!cancelled) setStatus("error");
        return;
      }

      // Persist the exact session returned by the QR exchange. This makes the
      // protected /student/* routes immediately see the same authenticated pupil.
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: verifyData.session.access_token,
        refresh_token: verifyData.session.refresh_token,
      });

      if (!cancelled) setStatus(sessionError ? "error" : "ready");
    };

    authenticate();
    return () => { cancelled = true; };
  }, [token]);

  if (!token) return <Navigate to="/login" replace />;
  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }
  if (status === "error") return <Navigate to="/login" replace />;

  return <StudentDashboard scannedToken={token} />;
};

export default StudentPortalEntry;
