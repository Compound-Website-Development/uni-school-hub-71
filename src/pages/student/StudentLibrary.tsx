import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppCard, SectionHeader, EmptyState, StatusWord, IconBadge, UnderlineTabs } from "@/components/student/editorial";
import { BookOpen, Search, Loader2, Library } from "lucide-react";
import { format } from "date-fns";

const fmt = (d?: string | null) => (d ? format(new Date(d), "d MMM yyyy") : "—");

const StudentLibrary = () => {
  const { studentData } = useAuth();
  const [books, setBooks] = useState<any[]>([]);
  const [myIssues, setMyIssues] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"issued" | "catalogue">("issued");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [booksRes, issuesRes] = await Promise.all([
        supabase.from("library_books").select("*").order("title"),
        studentData
          ? supabase
              .from("book_issues")
              .select("*, library_books(title, author, isbn)")
              .eq("student_id", studentData.id)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      setBooks(booksRes.data || []);
      setMyIssues((issuesRes.data as any[]) || []);
      setIsLoading(false);
    };
    fetchData();
  }, [studentData]);

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.author || "").toLowerCase().includes(search.toLowerCase()),
  );

  if (isLoading) {
    return (
      <StudentLayout title="Library" back="/student">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Library" back="/student">
      <div className="mx-auto w-full max-w-3xl space-y-4 pb-6">
        <UnderlineTabs
          value={tab}
          onChange={(v) => setTab(v as any)}
          options={[
            { value: "issued", label: `Issued Books (${myIssues.length})` },
            { value: "catalogue", label: "Catalogue" },
          ]}
        />

        {tab === "issued" ? (
          myIssues.length ? (
            <div className="space-y-3">
              {myIssues.map((issue: any) => (
                <AppCard key={issue.id} className="animate-fade-up">
                  <div className="flex items-start gap-3">
                    <IconBadge icon={BookOpen} tone="primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[15px] font-bold text-foreground">
                        {issue.library_books?.title || "Book"}
                      </p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        by {issue.library_books?.author || "Unknown"}
                      </p>
                    </div>
                    <StatusWord
                      label={issue.status || "issued"}
                      tone={issue.status === "returned" ? "success" : issue.status === "overdue" ? "alert" : "accent"}
                    />
                  </div>
                  <dl className="mt-3 space-y-2 border-t border-border/60 pt-3">
                    {[
                      ["Accession Number", issue.library_books?.isbn || issue.id?.slice(0, 8)],
                      ["Issue Date", fmt(issue.issue_date)],
                      ["Expected Return", fmt(issue.due_date)],
                      ["Actual Return", fmt(issue.return_date)],
                    ].map(([k, v]) => (
                      <div key={String(k)} className="flex items-center justify-between gap-3">
                        <dt className="text-[12px] text-muted-foreground">{k}</dt>
                        <dd className="num text-[12.5px] font-bold text-foreground">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </AppCard>
              ))}
            </div>
          ) : (
            <EmptyState title="No books issued" hint="Borrowed books and return dates will show here." />
          )
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search the catalogue…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 rounded-2xl border-border/60 bg-card pl-10 text-sm shadow-elev-1"
              />
            </div>
            <SectionHeader title={`Catalogue (${filtered.length})`} />
            {filtered.length === 0 ? (
              <EmptyState title="No books found" hint="Try a different title or author." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.map((b) => (
                  <AppCard key={b.id} className="animate-fade-up">
                    <div className="flex items-start gap-3">
                      <IconBadge icon={Library} tone="accent" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold text-foreground">{b.title}</p>
                        <p className="truncate text-[12px] text-muted-foreground">{b.author || "Unknown author"}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          {b.category && <StatusWord label={b.category} tone="muted" />}
                          <span className="num text-[11.5px] font-semibold text-muted-foreground">
                            {b.available}/{b.quantity} available
                          </span>
                        </div>
                      </div>
                    </div>
                  </AppCard>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentLibrary;
