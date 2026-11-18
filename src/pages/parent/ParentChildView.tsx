import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StudentDashboard from "@/pages/student/StudentDashboard";

/** Parent watches a linked child's pupil dashboard without signing out. Read-only. */
const ParentChildView = () => {
  const { id } = useParams();
  const [child, setChild] = useState<any>(null);
  const [state, setState] = useState<"loading" | "ok" | "none">("loading");
  useEffect(() => {
    if (!id) return;
    supabase.from("students").select("id, first_name, public_token").eq("id", id).maybeSingle()
      .then(({ data }) => { setChild(data); setState(data?.public_token ? "ok" : "none"); });
  }, [id]);
  if (state === "loading") return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (state === "none") return <div className="p-8 text-center text-sm">This child isn't linked to your account. <Link className="text-primary underline" to="/parent">Back</Link></div>;
  return <div>
    <div className="sticky top-0 z-[60] flex items-center gap-2 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
      <Eye className="h-4 w-4" /><span className="flex-1 truncate">Watching {child.first_name}'s view</span>
      <Link to="/parent" className="flex items-center gap-1 rounded-full bg-primary-foreground/15 px-3 py-1"><ArrowLeft className="h-3.5 w-3.5" />Back to parent</Link>
    </div>
    <StudentDashboard scannedToken={child.public_token} />
  </div>;
};
export default ParentChildView;
