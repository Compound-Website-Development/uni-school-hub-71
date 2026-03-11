import { useState, useEffect } from "react";
import { ParentLayout } from "@/components/layout/ParentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MessagesSquare, MessageCircle, Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const ParentForum = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [replies, setReplies] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase.from("forum_posts").select("*").order("created_at", { ascending: false }).limit(30);
      setPosts(data || []);
      if (data && data.length > 0) {
        const postIds = data.map((p: any) => p.id);
        const { data: repliesData } = await supabase.from("forum_replies").select("*").in("post_id", postIds).order("created_at", { ascending: true });
        const grouped: Record<string, any[]> = {};
        (repliesData || []).forEach((r: any) => {
          if (!grouped[r.post_id]) grouped[r.post_id] = [];
          grouped[r.post_id].push(r);
        });
        setReplies(grouped);
      }
      setIsLoading(false);
    };
    fetchPosts();
  }, []);

  const handlePost = async () => {
    if (!newTitle.trim() || !newBody.trim() || !user) return;
    const { error } = await supabase.from("forum_posts").insert({ author_id: user.id, title: newTitle, body: newBody });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Post created" });
    setNewTitle(""); setNewBody(""); setDialogOpen(false);
    const { data } = await supabase.from("forum_posts").select("*").order("created_at", { ascending: false }).limit(30);
    setPosts(data || []);
  };

  const handleReply = async (postId: string) => {
    const text = replyText[postId];
    if (!text?.trim() || !user) return;
    const { error } = await supabase.from("forum_replies").insert({ post_id: postId, author_id: user.id, body: text });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setReplyText({ ...replyText, [postId]: "" });
    const { data } = await supabase.from("forum_replies").select("*").eq("post_id", postId).order("created_at", { ascending: true });
    setReplies({ ...replies, [postId]: data || [] });
  };

  if (isLoading) {
    return <ParentLayout title="Forum"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></ParentLayout>;
  }

  return (
    <ParentLayout title="Discussion Forum">
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Community Forum</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> New Post</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Post</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Post title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                <Textarea placeholder="Write your post..." value={newBody} onChange={(e) => setNewBody(e.target.value)} rows={4} />
                <Button onClick={handlePost} className="w-full">Post</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {posts.length === 0 ? (
          <Card><CardContent className="p-8 text-center"><MessagesSquare className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No discussions yet. Start one!</p></CardContent></Card>
        ) : posts.map((post) => (
          <Card key={post.id} className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{post.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleString()}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground mb-4">{post.body}</p>
              {(replies[post.id] || []).map((r: any) => (
                <div key={r.id} className="ml-4 p-2 border-l-2 border-muted mb-2">
                  <p className="text-sm">{r.body}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Reply..."
                  value={replyText[post.id] || ""}
                  onChange={(e) => setReplyText({ ...replyText, [post.id]: e.target.value })}
                  className="flex-1"
                />
                <Button size="sm" onClick={() => handleReply(post.id)}><MessageCircle className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ParentLayout>
  );
};

export default ParentForum;
