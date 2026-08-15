import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { kindOf, KIND_LABEL, isExternal, LearningKind } from "@/lib/learningResources";
import { ArrowLeft, AlignLeft, CheckCircle2, Folder, Download, ExternalLink, Loader2, Play } from "lucide-react";

const StudentLessonNote = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data } = await supabase
        .from("academic_resources")
        .select("*, subjects(name), classes(name)")
        .eq("id", id)
        .eq("is_published", true)
        .maybeSingle();
      setResource(data);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <StudentLayout title="Lesson Note">
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </StudentLayout>
    );
  }

  if (!resource) {
    return (
      <StudentLayout title="Lesson Note">
        <Card className="rounded-2xl"><CardContent className="p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">This resource is not available.</p>
          <Button asChild variant="outline"><Link to="/student/learning">Back to Learning Hub</Link></Button>
        </CardContent></Card>
      </StudentLayout>
    );
  }

  const kind = kindOf(resource) as LearningKind;
  const paragraphs = (resource.description || "").split(/\n{2,}/).filter(Boolean);
  const objectives = (resource.description || "")
    .split("\n")
    .map((l: string) => l.trim())
    .filter((l: string) => /^[-*•]\s+/.test(l))
    .map((l: string) => l.replace(/^[-*•]\s+/, ""));
  const summary = paragraphs.filter((p: string) => !/^[-*•]\s+/.test(p.trim()));

  return (
    <StudentLayout title="Lesson Note">
      <div className="space-y-5 animate-fade-in max-w-2xl">
        <button onClick={() => navigate("/student/learning")} className="flex items-center gap-2 text-sm text-primary font-medium">
          <ArrowLeft className="w-4 h-4" /> Learning Hub
        </button>

        <div>
          <div className="flex items-center gap-2">
            {resource.subjects?.name && <Badge variant="secondary" className="text-xs">{resource.subjects.name}</Badge>}
            <Badge className="bg-primary/10 text-primary border-0 text-xs">{KIND_LABEL[kind]}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-foreground mt-2">{resource.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {resource.classes?.name ? `${resource.classes.name} • ` : ""}
            {new Date(resource.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>

        <Card className="rounded-2xl shadow-card border-t-4 border-t-primary">
          <CardContent className="p-5 space-y-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><AlignLeft className="w-4 h-4 text-primary" /> Summary</h2>
            {summary.length ? (
              summary.map((p: string, i: number) => <p key={i} className="text-sm text-muted-foreground whitespace-pre-line">{p}</p>)
            ) : (
              <p className="text-sm text-muted-foreground">No summary provided for this resource.</p>
            )}
          </CardContent>
        </Card>

        {objectives.length > 0 && (
          <Card className="rounded-2xl shadow-card">
            <CardContent className="p-5 space-y-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Objectives</h2>
              <ul className="space-y-2">
                {objectives.map((o: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <Play className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" /> {o}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl shadow-card">
          <CardContent className="p-5 space-y-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><Folder className="w-4 h-4 text-primary" /> Resources</h2>
            {resource.file_url ? (
              <a
                href={resource.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  {isExternal(resource.file_url) ? <ExternalLink className="w-4 h-4 text-primary" /> : <Download className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{resource.title}</p>
                  <p className="text-xs text-muted-foreground">{isExternal(resource.file_url) ? "External link" : `${KIND_LABEL[kind]} file`}</p>
                </div>
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">No attachment for this resource.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
};

export default StudentLessonNote;
