import { Badge } from "@/components/ui/badge";
import { TaskStatus, type TaskStatusType } from "@shared/schema";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: TaskStatusType;
  className?: string;
}

const statusConfig: Record<TaskStatusType, { label: string; className: string }> = {
  [TaskStatus.TODO]: {
    label: "To Do",
    className: "bg-muted text-muted-foreground",
  },
  [TaskStatus.IN_PROGRESS]: {
    label: "In Progress",
    className: "bg-primary/10 text-primary",
  },
  [TaskStatus.DONE]: {
    label: "Done",
    className: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="secondary"
      className={cn("font-medium", config.className, className)}
      data-testid={`badge-status-${status.toLowerCase()}`}
    >
      {config.label}
    </Badge>
  );
}
