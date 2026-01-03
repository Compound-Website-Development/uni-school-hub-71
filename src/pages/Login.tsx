import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user, userRole, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      if (userRole === "student") {
        navigate("/student");
      } else if (userRole === "teacher" || userRole === "admin") {
        navigate("/staff");
      }
    }
  }, [user, userRole, authLoading, navigate]);

  const validateForm = () => {
    try {
      loginSchema.parse(loginForm);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as "email" | "password"] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    const { error } = await signIn(loginForm.email, loginForm.password);

    setIsLoading(false);

    if (error) {
      let message = "Invalid credentials. Please try again.";
      if (error.message?.includes("Invalid login")) {
        message = "Invalid email or password. Please check your credentials.";
      } else if (error.message?.includes("Email not confirmed")) {
        message = "Please verify your email before logging in.";
      }
      
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Welcome back!",
      description: "You have successfully logged in.",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-pattern-dots opacity-30" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-xl">
              <span className="material-symbols-outlined text-primary text-3xl">school</span>
            </div>
            <span className="text-2xl font-bold text-foreground">EduPortal</span>
          </Link>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="student" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="student" className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">person</span>
                  Student
                </TabsTrigger>
                <TabsTrigger value="staff" className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">badge</span>
                  Staff
                </TabsTrigger>
              </TabsList>

              {/* Student Login */}
              <TabsContent value="student">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentEmail">Email Address</Label>
                    <Input
                      id="studentEmail"
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentPassword">Password</Label>
                    <Input
                      id="studentPassword"
                      type="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className={errors.password ? "border-destructive" : ""}
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>

                  <Button type="submit" className="w-full bg-gradient-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined mr-2">login</span>
                        Sign In
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                  <p>Don't have an account yet?</p>
                  <Link to="/apply" className="text-primary hover:underline font-medium">
                    Apply for Admission
                  </Link>
                </div>
              </TabsContent>

              {/* Staff Login */}
              <TabsContent value="staff">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="staffEmail">Email Address</Label>
                    <Input
                      id="staffEmail"
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staffPassword">Password</Label>
                    <Input
                      id="staffPassword"
                      type="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className={errors.password ? "border-destructive" : ""}
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>

                  <Button type="submit" className="w-full bg-gradient-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined mr-2">login</span>
                        Sign In
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    <span className="material-symbols-outlined text-warning align-middle mr-1">info</span>
                    Staff accounts are created by the administrator.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/" className="hover:text-foreground">← Back to home</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
