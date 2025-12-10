import { Badge } from "@/components/ui/badge";
import { UserRole, type UserRoleType } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Shield, User } from "lucide-react";

interface RoleBadgeProps {
  role: UserRoleType;
  className?: string;
}

const roleConfig: Record<UserRoleType, { label: string; className: string; icon: typeof Shield }> = {
  [UserRole.ADMIN]: {
    label: "Admin",
    className: "bg-primary/10 text-primary",
    icon: Shield,
  },
  [UserRole.MEMBER]: {
    label: "Member",
    className: "bg-muted text-muted-foreground",
    icon: User,
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge
      variant="secondary"
      className={cn("gap-1 font-medium", config.className, className)}
      data-testid={`badge-role-${role.toLowerCase()}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
