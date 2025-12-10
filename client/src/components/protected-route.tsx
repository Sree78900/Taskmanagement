import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAppSelector } from "@/store/hooks";
import { UserRole, type UserRoleType } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRoleType;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { user, isLoading, isInitialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isInitialized && !isLoading) {
      if (!user) {
        setLocation("/login");
      } else if (requiredRole && user.role !== requiredRole) {
        if (user.role === UserRole.ADMIN) {
          setLocation("/admin");
        } else {
          setLocation("/tasks");
        }
      }
    }
  }, [user, isLoading, isInitialized, requiredRole, setLocation]);

  if (!isInitialized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
