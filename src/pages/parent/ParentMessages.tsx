import { useState, useEffect } from "react";
import { ParentLayout } from "@/components/layout/ParentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Send, Loader2, Inbox } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ParentMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(50);
      setMessages(data || []);
      setIsLoading(false);
    };
    fetchMessages();

    const channel = supabase
      .channel("parent-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id === user?.id || msg.receiver_id === user?.id) {
          setMessages((prev) => [msg, ...prev]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleSend = async () => {
    if (!newBody.trim() || !user) return;
    setSending(true);
    // For now, messages go to admin - in real implementation, a receiver picker would be shown
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: user.id, // placeholder
      subject: newSubject || "No Subject",
      body: newBody,
    });
    setSending(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Message sent" });
    setNewSubject("");
    setNewBody("");
  };

  if (isLoading) {
    return <ParentLayout title="Messages"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></ParentLayout>;
  }

  return (
    <ParentLayout title="Messages">
      <div className="space-y-6 animate-fade-in">
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-base">Compose Message</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Subject" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
            <Textarea placeholder="Write your message..." value={newBody} onChange={(e) => setNewBody(e.target.value)} rows={3} />
            <Button onClick={handleSend} disabled={sending || !newBody.trim()} className="w-full">
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send Message
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-base">Inbox</CardTitle></CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Inbox className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => (
                  <div key={msg.id} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium">{msg.subject || "No Subject"}</p>
                      {!msg.is_read && msg.receiver_id === user?.id && <Badge className="text-[10px]">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{msg.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ParentLayout>
  );
};

export default ParentMessages;
