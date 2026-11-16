import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Send, Pin, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface WallPost {
  id: string; author_id: string; content: string; is_pinned?: boolean; created_at: string;
  author_name?: string; author_role?: string; likes?: number; comments?: number; liked_by_me?: boolean;
}
interface Comment { id:string; author_id:string; content:string; created_at:string; author_name?:string; }

export const CommunityWall = () => {
  const { user, userRole } = useAuth();
  const [posts,setPosts]=useState<WallPost[]>([]);
  const [newPost,setNewPost]=useState("");
  const [posting,setPosting]=useState(false);
  const [openComments,setOpenComments]=useState<Record<string,Comment[]>>({});
  const [commentInput,setCommentInput]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(true);

  const enrichPosts=useCallback(async(rawPosts:any[])=>{
    if(!rawPosts.length) return [];
    const ids=rawPosts.map(p=>p.id); const authorIds=[...new Set(rawPosts.map(p=>p.author_id))];
    const [reactions,comments,profiles,teachers,students]=await Promise.all([
      supabase.from("wall_reactions").select("post_id,user_id").in("post_id",ids),
      supabase.from("wall_comments").select("post_id").in("post_id",ids),
      supabase.from("profiles").select("user_id,first_name,last_name").in("user_id",authorIds),
      supabase.from("teachers").select("user_id,first_name,last_name").in("user_id",authorIds),
      supabase.from("students").select("user_id,first_name,last_name").in("user_id",authorIds),
    ]);
    const nameMap:Record<string,{name:string;role:string}>={};
    teachers.data?.forEach(t=>{if(t.user_id)nameMap[t.user_id]={name:`${t.first_name} ${t.last_name}`,role:"Staff"};});
    students.data?.forEach(s=>{if(s.user_id)nameMap[s.user_id]={name:`${s.first_name} ${s.last_name}`,role:"Student"};});
    profiles.data?.forEach(p=>{if(!nameMap[p.user_id])nameMap[p.user_id]={name:`${p.first_name} ${p.last_name}`,role:"Member"};});
    return rawPosts.map(p=>{
      const postReactions=reactions.data?.filter(r=>r.post_id===p.id)||[];
      const postComments=comments.data?.filter(c=>c.post_id===p.id)||[];
      return {...p,author_name:nameMap[p.author_id]?.name||"User",author_role:nameMap[p.author_id]?.role||"Member",
        likes:postReactions.length,comments:postComments.length,liked_by_me:postReactions.some(r=>r.user_id===user?.id)};
    });
  },[user?.id]);

  const loadPosts=useCallback(async()=>{
    const {data,error}=await supabase.from("wall_posts").select("*").order("created_at",{ascending:false}).limit(50);
    if(error)console.error("Wall load failed:",error.message);
    setPosts(data?await enrichPosts(data):[]); setLoading(false);
  },[enrichPosts]);

  const loadRef=useRef(loadPosts); loadRef.current=loadPosts;
  useEffect(()=>{loadPosts();},[loadPosts]);
  useEffect(()=>{
    const topic=`wall-feed-${Math.random().toString(36).slice(2)}`;
    const channel=supabase.channel(topic)
      .on("postgres_changes",{event:"*",schema:"public",table:"wall_posts"},()=>loadRef.current())
      .on("postgres_changes",{event:"*",schema:"public",table:"wall_reactions"},()=>loadRef.current())
      .subscribe();
    return()=>{supabase.removeChannel(channel);};
  },[]);

  const handlePost=async()=>{
    if(!newPost.trim()||!user)return;
    setPosting(true);
    const {error}=await supabase.from("wall_posts").insert({author_id:user.id,content:newPost.trim()});
    if(error)toast.error("Couldn't post"); else {setNewPost("");toast.success("Posted to the wall!");}
    setPosting(false);
  };
  const handleLike=async(post:WallPost)=>{
    if(!user)return;
    if(post.liked_by_me) await supabase.from("wall_reactions").delete().eq("post_id",post.id).eq("user_id",user.id);
    else await supabase.from("wall_reactions").insert({post_id:post.id,user_id:user.id,reaction:"like"});
    loadPosts();
  };
  const handleDelete=async(id:string)=>{await supabase.from("wall_posts").delete().eq("id",id);toast.success("Post deleted");loadPosts();};
  const toggleComments=async(postId:string)=>{
    if(openComments[postId]){const next={...openComments};delete next[postId];setOpenComments(next);return;}
    const {data}=await supabase.from("wall_comments").select("*").eq("post_id",postId).order("created_at");
    if(!data)return;
    const authorIds=[...new Set(data.map(c=>c.author_id))];
    const [t,s,p]=await Promise.all([
      supabase.from("teachers").select("user_id,first_name,last_name").in("user_id",authorIds),
      supabase.from("students").select("user_id,first_name,last_name").in("user_id",authorIds),
      supabase.from("profiles").select("user_id,first_name,last_name").in("user_id",authorIds),
    ]);
    const names:Record<string,string>={};
    t.data?.forEach(x=>{if(x.user_id)names[x.user_id]=`${x.first_name} ${x.last_name}`;});
    s.data?.forEach(x=>{if(x.user_id)names[x.user_id]=`${x.first_name} ${x.last_name}`;});
    p.data?.forEach(x=>{if(!names[x.user_id])names[x.user_id]=`${x.first_name} ${x.last_name}`;});
    setOpenComments({...openComments,[postId]:data.map(c=>({...c,author_name:names[c.author_id]||"User"}))});
  };
  const handleComment=async(postId:string)=>{
    const text=commentInput[postId]?.trim(); if(!text||!user)return;
    await supabase.from("wall_comments").insert({post_id:postId,author_id:user.id,content:text});
    setCommentInput({...commentInput,[postId]:""});
    setOpenComments(prev=>({...prev}));
    await toggleComments(postId); await toggleComments(postId); loadPosts();
  };
  const initials=(name:string)=>name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();

  return (
    <div className="community-wall-shell space-y-5">
      <section className="community-composer overflow-hidden rounded-[28px] p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="community-avatar grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-extrabold">{user?.email?.[0]?.toUpperCase()||"U"}</div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#4f8063]">School community</p>
            <h2 className="portal-display mt-1 text-2xl font-extrabold text-[#26362b]">What&apos;s happening?</h2>
            <Textarea placeholder="Share something useful with the school community…" value={newPost} onChange={e=>setNewPost(e.target.value)} rows={3} className="mt-4 resize-none rounded-2xl border-[#dfe6e1] bg-white focus-visible:ring-[#4f8063]/25"/>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-[#c58a45]"/> Posting as <span className="font-bold capitalize text-foreground">{userRole}</span></div>
              <Button onClick={handlePost} disabled={posting||!newPost.trim()} className="rounded-full bg-[#4f8063] px-4 hover:bg-[#416b52]"><Send className="mr-2 h-4 w-4"/>Share</Button>
            </div>
          </div>
        </div>
      </section>

      {loading ? <p className="py-12 text-center text-sm text-muted-foreground">Loading the wall…</p> :
       posts.length===0 ? <div className="rounded-[26px] border border-dashed border-[#d7dfd9] bg-white/70 py-16 text-center"><p className="font-bold text-[#4b5a50]">No posts yet.</p><p className="mt-1 text-sm text-muted-foreground">Be the first to share something useful.</p></div> :
       posts.map(post=>(
        <article key={post.id} className="community-post overflow-hidden rounded-[26px] p-5 md:p-6">
          {post.is_pinned && <div className="mb-4 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#b56f35]"><Pin className="h-3 w-3"/> Pinned post</div>}
          <div className="flex items-start gap-3">
            <Avatar className="community-avatar h-11 w-11 shrink-0"><AvatarFallback className="font-extrabold">{initials(post.author_name||"U")}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-extrabold text-[#2f3f34]">{post.author_name}</p><Badge variant="secondary" className="rounded-full bg-[#eef3ef] px-2 py-0.5 text-[9px] text-[#4f8063]">{post.author_role}</Badge><span className="text-xs text-muted-foreground">· {formatDistanceToNow(new Date(post.created_at),{addSuffix:true})}</span></div>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-[#465249]">{post.content}</p>
              <div className="mt-5 flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={()=>handleLike(post)} className={cnAction("community-action",post.liked_by_me)}><Heart className={`h-4 w-4 ${post.liked_by_me?"fill-current":""}`}/><span>{post.likes}</span></Button>
                <Button variant="ghost" size="sm" onClick={()=>toggleComments(post.id)} className="community-action text-muted-foreground"><MessageCircle className="h-4 w-4"/><span>{post.comments}</span></Button>
                {(post.author_id===user?.id||userRole==="admin")&&<Button variant="ghost" size="sm" onClick={()=>handleDelete(post.id)} className="community-action ml-auto text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5"/></Button>}
              </div>
              {openComments[post.id]&&(
                <div className="mt-4 space-y-3 rounded-2xl bg-[#f5f6f3] p-4">
                  {openComments[post.id].map(c=><div key={c.id} className="flex gap-2"><Avatar className="h-7 w-7"><AvatarFallback className="bg-white text-[10px]">{initials(c.author_name||"U")}</AvatarFallback></Avatar><div className="flex-1 rounded-2xl bg-white px-3 py-2"><p className="text-xs font-bold">{c.author_name}</p><p className="mt-0.5 text-sm">{c.content}</p></div></div>)}
                  <div className="flex gap-2 pt-1"><input value={commentInput[post.id]||""} onChange={e=>setCommentInput({...commentInput,[post.id]:e.target.value})} onKeyDown={e=>e.key==="Enter"&&handleComment(post.id)} placeholder="Write a comment…" className="flex-1 rounded-full border border-[#dfe6e1] bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f8063]/20"/><Button size="sm" onClick={()=>handleComment(post.id)} className="h-9 rounded-full bg-[#4f8063] px-3"><Send className="h-3.5 w-3.5"/></Button></div>
                </div>
              )}
            </div>
          </div>
        </article>
       ))
      }
    </div>
  );
};

const cnAction=(base:string,active?:boolean)=>`${base} h-9 gap-1.5 px-3 ${active?"like-active":""}`;

