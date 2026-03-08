import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import npsLogo from "@/assets/nps-logo.png";
import { Lock, Loader2, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setHasToken(true);
    }

    // Listen for auth state changes from the recovery link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasToken(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords don't match"); return; }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      toast.error(error.message || "Failed to reset password");
    } else {
      setIsSuccess(true);
      toast.success("Password updated successfully!");
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-pattern-dots opacity-30" />
      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <img src={npsLogo} alt="NPS" className="h-16 mx-auto mb-4" />
          <p className="text-muted-foreground">Reset your password</p>
        </div>

        <Card className="shadow-lg border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              New Password
            </CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
                <p className="font-semibold text-foreground">Password Updated!</p>
                <p className="text-sm text-muted-foreground mt-1">Redirecting to login...</p>
              </div>
            ) : !hasToken ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">Invalid or expired reset link.</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate("/login")}>
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter new password" />
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isLoading ? "Updating..." : "Reset Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
