import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { kindOf, KIND_LABEL, LEARNING_FILTERS, LearningKind } from "@/lib/learningResources";
import { BookOpen, Search, FileText, Video, Headphones, Book, Link as LinkIcon, Play, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const kindIcon: Record<LearningKind, any> = {
  video: Video,
  article: FileText,
  book: Book,
  audio: Headphones,
  link: LinkIcon,
};

const StudentLearningHub = () => {
  const { studentData } = useAuth();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | LearningKind>("all");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("academic_resources")
        .select("*, subjects(name)")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      const all = data || [];
      setResources(
        studentData?.class_id ? all.filter((r: any) => !r.class_id || r.class_id === studentData.class_id) : all,
      );
      setLoading(false);
    };
    load();
  }, [studentData?.class_id]);

  const withKind = resources.map((r) => ({ ...r, kind: kindOf(r) as LearningKind }));
  const filtered = withKind.filter((r) => {
    const q = search.trim().toLowerCase();
    const matchQ = !q || r.title.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q);
    return matchQ && (filter === "all" || r.kind === filter);
  });

  const featured = filtered.find((r) => r.kind === "video") || filtered[0];
  const rest = filtered.filter((r) => r.id !== featured?.id);
  const articles = rest.filter((r) => r.kind === "article").slice(0, 4);
  const books = rest.filter((r) => r.kind === "book").slice(0, 6);
  const audio = rest.filter((r) => r.kind === "audio").slice(0, 6);
  const others = rest.filter((r) => !["article", "book", "audio"].includes(r.kind));

  const Row = ({ r }: { r: any }) => {
    const Icon = kindIcon[r.kind as LearningKind];
    return (
      <Link to={`/student/learning/${r.id}`}>
        <Card className="rounded-2xl border-border/50 shadow-card hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0"><Icon className="w-5 h-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {r.subjects?.name || KIND_LABEL[r.kind as LearningKind]}
              </p>
              <p className="font-semibold text-sm text-foreground truncate">{r.title}</p>
              {r.description && <p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <StudentLayout title="Learning Hub">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" /> Learning Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Videos, articles, books and audio lessons for your class</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 rounded-xl" placeholder="Search resources..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {LEARNING_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium shrink-0 transition-all shadow-sm",
                filter === f.value ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="py-12 text-center text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No resources found</p>
              <p className="text-xs mt-1">Check back later for new learning materials</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {featured && (
              <section className="space-y-3">
                <h2 className="font-semibold text-foreground">
                  {featured.kind === "video" ? "Featured Video" : "Featured Resource"}
                </h2>
                <Card className="rounded-2xl overflow-hidden shadow-card">
                  <div className="h-40 bg-primary/10 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-card shadow-lg flex items-center justify-center">
                      <Play className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-2">
                    {featured.subjects?.name && <Badge variant="secondary" className="text-xs">{featured.subjects.name}</Badge>}
                    <h3 className="font-bold text-foreground">{featured.title}</h3>
                    {featured.description && <p className="text-sm text-muted-foreground line-clamp-3">{featured.description}</p>}
                    <Button asChild className="w-full shadow-md mt-1">
                      <Link to={`/student/learning/${featured.id}`}>
                        {featured.kind === "video" ? "Watch Now" : "Open Resource"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </section>
            )}

            {articles.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-semibold text-foreground">Recent Articles</h2>
                <div className="space-y-3">{articles.map((r) => <Row key={r.id} r={r} />)}</div>
              </section>
            )}

            {books.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-semibold text-foreground">Textbooks &amp; PDFs</h2>
                <div className="grid gap-3 sm:grid-cols-2">{books.map((r) => <Row key={r.id} r={r} />)}</div>
              </section>
            )}

            {audio.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-semibold text-foreground">Audio Lessons</h2>
                <div className="space-y-3">{audio.map((r) => <Row key={r.id} r={r} />)}</div>
              </section>
            )}

            {others.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-semibold text-foreground">More Resources</h2>
                <div className="grid gap-3 sm:grid-cols-2">{others.map((r) => <Row key={r.id} r={r} />)}</div>
              </section>
            )}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentLearningHub;
