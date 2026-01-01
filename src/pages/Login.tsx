import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [studentForm, setStudentForm] = useState({ studentId: "", password: "" });
  const [staffForm, setStaffForm] = useState({ email: "", password: "" });

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Demo login - navigate to student dashboard
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      navigate("/student");
    }, 1000);
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Demo login - navigate to staff dashboard
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      navigate("/staff");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-pattern-dots opacity-30"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-up">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-xl">
              <span className="material-symbols-outlined text-primary text-3xl">school</span>
            </div>
            <span className="text-2xl font-bold text-foreground">EduPortal</span>
          </Link>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <Card className="animate-fade-up animation-delay-100">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Choose your account type to continue
            </CardDescription>
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
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      placeholder="Enter your student ID (e.g., 2026001)"
                      value={studentForm.studentId}
                      onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentPassword">Password</Label>
                    <Input
                      id="studentPassword"
                      type="password"
                      placeholder="Enter your password"
                      value={studentForm.password}
                      onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-muted-foreground">Remember me</span>
                    </label>
                    <a href="#" className="text-primary hover:underline">Forgot password?</a>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary"
                    disabled={isLoading}
                  >
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
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="staffEmail">Email Address</Label>
                    <Input
                      id="staffEmail"
                      type="email"
                      placeholder="Enter your email"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staffPassword">Password</Label>
                    <Input
                      id="staffPassword"
                      type="password"
                      placeholder="Enter your password"
                      value={staffForm.password}
                      onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-muted-foreground">Remember me</span>
                    </label>
                    <a href="#" className="text-primary hover:underline">Forgot password?</a>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary"
                    disabled={isLoading}
                  >
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
                    Staff accounts are created by the administrator. Contact your school admin if you need access.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/" className="hover:text-foreground">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
