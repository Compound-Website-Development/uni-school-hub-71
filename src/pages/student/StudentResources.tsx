import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Search, FileText, Video, Link as LinkIcon, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const typeIcons: Record<string, any> = {
  document: FileText,
  video: Video,
  link: LinkIcon,
  presentation: FileText,
};

const StudentResources = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const fetchResources = async () => {
      const { data } = await supabase
        .from("academic_resources")
        .select("*, subjects(name)")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      setResources(data || []);
      setIsLoading(false);
    };
    fetchResources();
  }, []);

  const filtered = resources.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || r.resource_type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return <StudentLayout title="Learning Resources"><div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}</div></StudentLayout>;
  }

  return (
    <StudentLayout title="Learning Resources">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary" /> Learning Resources</h2>
          <p className="text-sm text-muted-foreground mt-1">Access study materials, videos, and learning content</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search resources..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="link">Links</SelectItem>
              <SelectItem value="presentation">Presentations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((resource) => {
              const Icon = typeIcons[resource.resource_type] || FileText;
              return (
                <Card key={resource.id} className="card-hover-subtle border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-primary/10 shrink-0"><Icon className="w-5 h-5 text-primary" /></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground mb-1">{resource.title}</h3>
                        {resource.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{resource.description}</p>}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] capitalize">{resource.resource_type}</Badge>
                          {resource.subjects?.name && <Badge className="text-[10px] bg-primary/10 text-primary border-0">{resource.subjects.name}</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          {resource.file_url && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" asChild>
                              <a href={resource.file_url} target="_blank" rel="noopener noreferrer"><Download className="w-3 h-3" /> Download</a>
                            </Button>
                          )}
                          {resource.external_link && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" asChild>
                              <a href={resource.external_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3" /> Open</a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No resources found</p>
              <p className="text-xs mt-1">Check back later for new learning materials</p>
            </CardContent>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentResources;
