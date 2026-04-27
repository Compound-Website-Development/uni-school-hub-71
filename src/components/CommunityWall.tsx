import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Send, Pin, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface WallPost {
  id: string;
  author_id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  author_name?: string;
  author_role?: string;
  likes?: number;
  comments?: number;
  liked_by_me?: boolean;
}

interface Comment {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

export const CommunityWall = () => {
  const { user, userRole } = useAuth();
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState<Record<string, Comment[]>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const enrichPosts = useCallback(async (rawPosts: any[]) => {
    if (!rawPosts.length) return [];
    const ids = rawPosts.map(p => p.id);
    const authorIds = [...new Set(rawPosts.map(p => p.author_id))];

    const [reactions, comments, profiles, teachers, students] = await Promise.all([
      supabase.from("wall_reactions").select("post_id, user_id").in("post_id", ids),
      supabase.from("wall_comments").select("post_id").in("post_id", ids),
      supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", authorIds),
      supabase.from("teachers").select("user_id, first_name, last_name").in("user_id", authorIds),
      supabase.from("students").select("user_id, first_name, last_name").in("user_id", authorIds),
    ]);

    const nameMap: Record<string, { name: string; role: string }> = {};
    teachers.data?.forEach(t => { if (t.user_id) nameMap[t.user_id] = { name: `${t.first_name} ${t.last_name}`, role: "Staff" }; });
    students.data?.forEach(s => { if (s.user_id) nameMap[s.user_id] = { name: `${s.first_name} ${s.last_name}`, role: "Student" }; });
    profiles.data?.forEach(p => { if (!nameMap[p.user_id]) nameMap[p.user_id] = { name: `${p.first_name} ${p.last_name}`, role: "Member" }; });

    return rawPosts.map(p => {
      const postReactions = reactions.data?.filter(r => r.post_id === p.id) || [];
      const postComments = comments.data?.filter(c => c.post_id === p.id) || [];
      return {
        ...p,
        author_name: nameMap[p.author_id]?.name || "User",
        author_role: nameMap[p.author_id]?.role || "Member",
        likes: postReactions.length,
        comments: postComments.length,
        liked_by_me: postReactions.some(r => r.user_id === user?.id),
      };
    });
  }, [user?.id]);

  const loadPosts = useCallback(async () => {
    const { data } = await supabase
      .from("wall_posts")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setPosts(await enrichPosts(data));
    setLoading(false);
  }, [enrichPosts]);

  useEffect(() => {
    loadPosts();
    const channel = supabase
      .channel("wall-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "wall_posts" }, loadPosts)
      .on("postgres_changes", { event: "*", schema: "public", table: "wall_reactions" }, loadPosts)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadPosts]);

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    setPosting(true);
    const { error } = await supabase.from("wall_posts").insert({ author_id: user.id, content: newPost.trim() });
    if (error) toast.error("Couldn't post"); else { setNewPost(""); toast.success("Posted to the wall!"); }
    setPosting(false);
  };

  const handleLike = async (post: WallPost) => {
    if (!user) return;
    if (post.liked_by_me) {
      await supabase.from("wall_reactions").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      await supabase.from("wall_reactions").insert({ post_id: post.id, user_id: user.id, reaction: "like" });
    }
    loadPosts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("wall_posts").delete().eq("id", id);
    toast.success("Post deleted");
    loadPosts();
  };

  const toggleComments = async (postId: string) => {
    if (openComments[postId]) {
      const next = { ...openComments }; delete next[postId]; setOpenComments(next); return;
    }
    const { data } = await supabase.from("wall_comments").select("*").eq("post_id", postId).order("created_at");
    if (!data) return;
    const authorIds = [...new Set(data.map(c => c.author_id))];
    const [t, s, p] = await Promise.all([
      supabase.from("teachers").select("user_id, first_name, last_name").in("user_id", authorIds),
      supabase.from("students").select("user_id, first_name, last_name").in("user_id", authorIds),
      supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", authorIds),
    ]);
    const names: Record<string,string> = {};
    t.data?.forEach(x => { if (x.user_id) names[x.user_id] = `${x.first_name} ${x.last_name}`; });
    s.data?.forEach(x => { if (x.user_id) names[x.user_id] = `${x.first_name} ${x.last_name}`; });
    p.data?.forEach(x => { if (!names[x.user_id]) names[x.user_id] = `${x.first_name} ${x.last_name}`; });
    setOpenComments({ ...openComments, [postId]: data.map(c => ({ ...c, author_name: names[c.author_id] || "User" })) });
  };

  const handleComment = async (postId: string) => {
    const text = commentInput[postId]?.trim();
    if (!text || !user) return;
    await supabase.from("wall_comments").insert({ post_id: postId, author_id: user.id, content: text });
    setCommentInput({ ...commentInput, [postId]: "" });
    toggleComments(postId); toggleComments(postId); // refresh
    loadPosts();
  };

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Composer */}
      <Card className="rounded-2xl border-border/50 shadow-lg overflow-hidden">
        <CardContent className="p-5">
          <div className="flex gap-3">
            <Avatar className="border-2 border-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Share something with the school community…"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                rows={3}
                className="resize-none border-border/60 focus-visible:ring-primary/40"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="w-3.5 h-3.5 text-accent" /> Posting as <span className="capitalize font-semibold text-foreground">{userRole}</span>
                </div>
                <Button onClick={handlePost} disabled={posting || !newPost.trim()} className="shadow-md hover:shadow-lg transition-all hover:scale-105">
                  <Send className="w-4 h-4 mr-2" /> Share
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      {loading ? (
        <p className="text-center text-muted-foreground text-sm py-12">Loading the wall…</p>
      ) : posts.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
          </CardContent>
        </Card>
      ) : (
        posts.map(post => (
          <Card key={post.id} className="rounded-2xl border-border/50 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden animate-fade-in">
            {post.is_pinned && (
              <div className="bg-gradient-to-r from-accent/20 to-primary/10 px-5 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-accent-foreground border-b border-border/30">
                <Pin className="w-3 h-3" /> Pinned post
              </div>
            )}
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Avatar className="border-2 border-primary/20 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold">
                    {initials(post.author_name || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{post.author_name}</p>
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{post.author_role}</Badge>
                    <span className="text-xs text-muted-foreground">· {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm leading-relaxed mt-2 whitespace-pre-wrap">{post.content}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-4 -ml-2">
                    <Button variant="ghost" size="sm" onClick={() => handleLike(post)} className={`h-8 px-2 gap-1.5 transition-all ${post.liked_by_me ? "text-rose-500" : "text-muted-foreground"} hover:scale-110`}>
                      <Heart className={`w-4 h-4 ${post.liked_by_me ? "fill-rose-500" : ""}`} />
                      <span className="text-xs font-medium">{post.likes}</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleComments(post.id)} className="h-8 px-2 gap-1.5 text-muted-foreground hover:text-primary">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">{post.comments}</span>
                    </Button>
                    {(post.author_id === user?.id || userRole === "admin") && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)} className="h-8 px-2 ml-auto text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Comments */}
                  {openComments[post.id] && (
                    <div className="mt-4 pt-4 border-t border-border/40 space-y-3 animate-fade-in">
                      {openComments[post.id].map(c => (
                        <div key={c.id} className="flex gap-2">
                          <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px] bg-muted">{initials(c.author_name || "U")}</AvatarFallback></Avatar>
                          <div className="flex-1 bg-muted/40 rounded-2xl px-3 py-2">
                            <p className="text-xs font-semibold">{c.author_name}</p>
                            <p className="text-sm mt-0.5">{c.content}</p>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2 pt-1">
                        <input
                          value={commentInput[post.id] || ""}
                          onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                          placeholder="Write a comment…"
                          className="flex-1 text-sm rounded-full border border-border/50 px-4 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <Button size="sm" onClick={() => handleComment(post.id)} className="rounded-full h-8 px-3"><Send className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
