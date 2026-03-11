import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Search, Loader2 } from "lucide-react";

const StudentLibrary = () => {
  const { studentData } = useAuth();
  const [books, setBooks] = useState<any[]>([]);
  const [myIssues, setMyIssues] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [booksRes, issuesRes] = await Promise.all([
        supabase.from("library_books").select("*").order("title"),
        studentData ? supabase.from("book_issues").select("*, library_books(title, author)").eq("student_id", studentData.id) : Promise.resolve({ data: [] }),
      ]);
      setBooks(booksRes.data || []);
      setMyIssues(issuesRes.data || []);
      setIsLoading(false);
    };
    fetchData();
  }, [studentData]);

  const filtered = books.filter((b) => b.title.toLowerCase().includes(search.toLowerCase()) || (b.author || "").toLowerCase().includes(search.toLowerCase()));

  if (isLoading) {
    return <StudentLayout title="Library"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></StudentLayout>;
  }

  return (
    <StudentLayout title="Library">
      <div className="space-y-6 animate-fade-in">
        {myIssues.length > 0 && (
          <Card className="border-border/50">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">My Borrowed Books</h3>
              <div className="space-y-2">
                {myIssues.map((issue: any) => (
                  <div key={issue.id} className="flex justify-between items-center p-2 rounded bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{issue.library_books?.title}</p>
                      <p className="text-xs text-muted-foreground">{issue.library_books?.author}</p>
                    </div>
                    <Badge variant={issue.status === "returned" ? "default" : "secondary"} className="capitalize">{issue.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search books..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        {filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center"><BookOpen className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No books found.</p></CardContent></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((b) => (
              <Card key={b.id} className="border-border/50">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm">{b.title}</h3>
                  <p className="text-xs text-muted-foreground">{b.author || "Unknown author"}</p>
                  <div className="flex justify-between items-center mt-2">
                    {b.category && <Badge variant="secondary" className="text-xs">{b.category}</Badge>}
                    <span className="text-xs text-muted-foreground">{b.available}/{b.quantity} available</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentLibrary;
