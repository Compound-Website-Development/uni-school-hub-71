import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ("student" | "teacher" | "admin")[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      // Admin can access all portals (staff + student views open in new tabs)
      if (userRole === "admin") {
        return; // Admin has universal access
      }

      if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
        if (userRole === "student") {
          navigate("/student", { replace: true });
        } else {
          navigate("/staff", { replace: true });
        }
      }
    }
  }, [user, isLoading, userRole, allowedRoles, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Admin can access everything
  if (userRole === "admin") return <>{children}</>;

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) return null;

  return <>{children}</>;
};
