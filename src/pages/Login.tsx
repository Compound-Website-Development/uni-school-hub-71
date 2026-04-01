import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import npsLogo from "@/assets/nps-logo.png";
import {
  GraduationCap,
  Briefcase,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  staffId: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginErrors = { email?: string; password?: string };
type RegisterErrors = { firstName?: string; lastName?: string; email?: string; phone?: string; password?: string; confirmPassword?: string; staffId?: string };

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, user, userRole, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [userType, setUserType] = useState<"student" | "staff" | "parent" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({});
  
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    staffId: "",
  });

  useEffect(() => {
    if (user && !authLoading && userRole) {
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      registerSchema.parse(registerForm);
      setRegisterErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: RegisterErrors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as keyof RegisterErrors] = err.message;
        });
        setRegisterErrors(fieldErrors);
      }
      return;
    }

    setIsLoading(true);
    const role = userType === "staff" ? "teacher" : userType === "parent" ? "parent" : "student";
    const { error } = await signUp(registerForm.email, registerForm.password, {
      first_name: registerForm.firstName,
      last_name: registerForm.lastName,
      role,
      phone: registerForm.phone,
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: "Registration Failed",
        description: error.message?.includes("already registered")
          ? "This email is already registered. Please sign in."
          : "Registration failed. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Account created!", description: "Please check your email to verify your account." });
    setAuthMode("login");
    setLoginForm({ email: registerForm.email, password: "" });
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
            <img src={npsLogo} alt="Nigerian Private Schools" className="h-16 mx-auto mb-4" />
          </Link>
          <p className="text-muted-foreground">
            {authMode === "login" ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <Card className="shadow-lg border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">
              {authMode === "login" ? "Welcome Back" : "Get Started"}
            </CardTitle>
            <CardDescription>
              {authMode === "login"
                ? "Enter your credentials to continue"
                : userType
                ? `Register as a ${userType === "student" ? "Student" : "Staff Member"}`
                : "Choose your account type"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authMode === "login" ? (
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
            ) : !userType ? (
              /* Role Selection */
              <div className="space-y-4">
                <button
                  onClick={() => setUserType("student")}
                  className="w-full p-5 rounded-xl border-2 border-border hover:border-primary bg-card hover:bg-primary/5 transition-all flex items-center gap-4 text-left group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <GraduationCap className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">I am a Student</p>
                    <p className="text-sm text-muted-foreground">Access your results, attendance & more</p>
                  </div>
                </button>

                <button
                  onClick={() => setUserType("staff")}
                  className="w-full p-5 rounded-xl border-2 border-border hover:border-primary bg-card hover:bg-primary/5 transition-all flex items-center gap-4 text-left group"
                >
                  <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Briefcase className="w-7 h-7 text-secondary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">I am a Staff Member</p>
                    <p className="text-sm text-muted-foreground">Manage classes, results & students</p>
                  </div>
                </button>

                <button
                  onClick={() => setUserType("parent")}
                  className="w-full p-5 rounded-xl border-2 border-border hover:border-primary bg-card hover:bg-primary/5 transition-all flex items-center gap-4 text-left group"
                >
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Users className="w-7 h-7 text-accent group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">I am a Parent</p>
                    <p className="text-sm text-muted-foreground">Monitor your child's progress</p>
                  </div>
                </button>
              </div>
            ) : (
              /* Registration Form */
              <form onSubmit={handleRegister} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setUserType(null)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Change role
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>First Name <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="John"
                      value={registerForm.firstName}
                      onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                      className={cn("rounded-md", registerErrors.firstName && "border-destructive")}
                    />
                    {registerErrors.firstName && <p className="text-xs text-destructive">{registerErrors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Doe"
                      value={registerForm.lastName}
                      onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                      className={cn("rounded-md", registerErrors.lastName && "border-destructive")}
                    />
                    {registerErrors.lastName && <p className="text-xs text-destructive">{registerErrors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email Address <span className="text-destructive">*</span></Label>
                  <Input
                    type="email"
                    placeholder="you@school.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className={cn("rounded-md", registerErrors.email && "border-destructive")}
                  />
                  {registerErrors.email && <p className="text-xs text-destructive">{registerErrors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Phone Number <span className="text-destructive">*</span></Label>
                  <Input
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    className={cn("rounded-md", registerErrors.phone && "border-destructive")}
                  />
                  {registerErrors.phone && <p className="text-xs text-destructive">{registerErrors.phone}</p>}
                </div>

                {userType === "staff" && (
                  <div className="space-y-2">
                    <Label>Staff ID / Employee Number</Label>
                    <Input
                      placeholder="EMP-2025-001"
                      value={registerForm.staffId}
                      onChange={(e) => setRegisterForm({ ...registerForm, staffId: e.target.value })}
                      className="rounded-md"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      className={cn("rounded-md pr-10", registerErrors.password && "border-destructive")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {registerErrors.password && <p className="text-xs text-destructive">{registerErrors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Confirm Password <span className="text-destructive">*</span></Label>
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    className={cn("rounded-md", registerErrors.confirmPassword && "border-destructive")}
                  />
                  {registerErrors.confirmPassword && <p className="text-xs text-destructive">{registerErrors.confirmPassword}</p>}
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 rounded-lg font-semibold transition-all hover:scale-[1.02]" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setUserType(null);
                }}
                className="text-sm text-primary hover:underline font-medium"
              >
                {authMode === "login"
                  ? "Don't have an account? Register"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/" className="hover:text-foreground flex items-center justify-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
