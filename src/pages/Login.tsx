import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QRScanner from "@/components/QRScanner";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import npsLogo from "@/assets/logo";
import {
  Eye,
  EyeOff,
  Loader2,
  Users,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginErrors = { email?: string; password?: string };

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user, userRole, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const handleScan = (text: string) => {
    setScanOpen(false);
    const match = text.match(/\/s\/([0-9a-fA-F-]{36})/) || text.match(/^([0-9a-fA-F-]{36})$/);
    if (match) {
      navigate(`/s/${match[1]}`);
      return;
    }
    if (/^https?:\/\//.test(text)) {
      try {
        const url = new URL(text);
        if (url.origin === window.location.origin) {
          navigate(url.pathname + url.search);
          return;
        }
      } catch { /* ignore */ }
    }
    toast({ title: "Card not recognised", description: "That QR code is not an Imagemakers ID card.", variant: "destructive" });
  };
  
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  useEffect(() => {
    if (user && !authLoading) {
      // Honour a same-origin `next` target (used by the OAuth consent flow).
      const next = new URLSearchParams(window.location.search).get("next");
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        window.location.replace(next);
        return;
      }
      if (!userRole) return;
      if (userRole === "student") navigate("/student", { replace: true });
      else if (userRole === "admin") navigate("/admin", { replace: true });
      else if (userRole === "teacher") navigate("/staff", { replace: true });
      else if (userRole === "parent") navigate("/parent", { replace: true });
    }
  }, [user, userRole, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      loginSchema.parse(loginForm);
      setLoginErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: LoginErrors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as keyof LoginErrors] = err.message;
        });
        setLoginErrors(fieldErrors);
      }
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginForm.email, loginForm.password);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message?.includes("Invalid login")
          ? "Invalid email or password."
          : error.message?.includes("Email not confirmed")
          ? "Please verify your email before logging in."
          : "Invalid credentials. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Welcome back!", description: "You have successfully logged in." });
  };


  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-pattern-dots opacity-30" />

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <img src={npsLogo} alt="Imagemakers Nursery and Primary School" className="h-16 mx-auto mb-4" />
          </Link>
          <p className="text-muted-foreground">Staff &amp; student sign in</p>
        </div>

        <Card className="shadow-lg border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@school.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className={cn("rounded-md", loginErrors.email && "border-destructive")}
                  />
                  {loginErrors.email && <p className="text-xs text-destructive">{loginErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className={cn("rounded-md pr-10", loginErrors.password && "border-destructive")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginErrors.password && <p className="text-xs text-destructive">{loginErrors.password}</p>}
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!loginForm.email) { toast({ title: "Enter your email", description: "Please enter your email address first.", variant: "destructive" }); return; }
                      const { error } = await supabase.auth.resetPasswordForEmail(loginForm.email, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });
                      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                      else toast({ title: "Check your email", description: "We've sent you a password reset link." });
                    }}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 rounded-lg font-semibold transition-all hover:scale-[1.02]" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

            <div className="mt-6 space-y-3">
              <div className="relative text-center">
                <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
                <span className="relative z-10 bg-card px-2 text-xs text-muted-foreground">or</span>
              </div>

              <button
                type="button"
                onClick={() => setScanOpen(true)}
                className="w-full p-4 rounded-xl border-2 border-border hover:border-primary bg-card hover:bg-primary/5 transition-all flex items-center gap-4 text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                  <QrCode className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Scan an ID card</p>
                  <p className="text-sm text-muted-foreground">Open a pupil profile from the QR code</p>
                </div>
              </button>

              <Link
                to="/parent-access"
                className="w-full p-4 rounded-xl border-2 border-dashed border-border hover:border-primary bg-card hover:bg-primary/5 transition-all flex items-center gap-4 text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                  <Users className="w-6 h-6 text-accent group-hover:text-primary-foreground transition-colors" />
                </div>
                <div>
                  <p className="font-bold text-foreground">I am a Parent</p>
                  <p className="text-sm text-muted-foreground">Use the Parent ID on your child&apos;s ID card</p>
                </div>
              </Link>
            </div>


          </CardContent>
        </Card>

        <Dialog open={scanOpen} onOpenChange={setScanOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Scan your ID card</DialogTitle>
            </DialogHeader>
            {scanOpen && <QRScanner onScan={handleScan} onClose={() => setScanOpen(false)} />}
          </DialogContent>
        </Dialog>


        <p className="text-center text-xs text-muted-foreground mt-6">
          Imparting Wisdom and Morals · LASG Approval No: SLR/14097
        </p>
      </div>
    </div>
  );
};

export default Login;
