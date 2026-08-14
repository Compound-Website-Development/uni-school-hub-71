import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import npsLogo from "@/assets/logo";

const ParentAccess = () => {
  const navigate = useNavigate();
  const [parentId, setParentId] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parentId.trim().length < 4 || code.trim().length < 4) {
      toast.error("Enter the Parent ID and access code printed on your child's ID card.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("parent-login", {
        body: { parentId: parentId.trim(), code: code.trim() },
      });
      if (error || (data as any)?.error) {
        toast.error((data as any)?.error || "Parent ID or access code is incorrect.");
        return;
      }
      const { email, password } = data as { email: string; password: string };
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        toast.error("Could not open your dashboard. Please try again.");
        return;
      }
      toast.success("Welcome! Opening your parent dashboard.");
      navigate("/parent", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-soft to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <img src={npsLogo} alt="Imagemakers Nursery and Primary School logo" className="w-16 h-16 mx-auto object-contain" />
          <CardTitle className="flex items-center justify-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Parent Access
          </CardTitle>
          <CardDescription>
            Enter the Parent ID and access code printed on the back of your child&apos;s ID card. Two parents may use the same ID.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parentId">Parent ID</Label>
              <Input
                id="parentId"
                placeholder="IMS-P-XXXXXX"
                value={parentId}
                maxLength={32}
                onChange={(e) => setParentId(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Access code</Label>
              <Input
                id="code"
                placeholder="XXXXXX"
                value={code}
                maxLength={32}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Open parent dashboard
            </Button>
            <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Back to staff &amp; student login
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentAccess;
