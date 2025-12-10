import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingState } from "@/components/loading-spinner";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { tasksApi } from "@/lib/api";
import { UserRole, TaskStatus, type TaskStatusType, type TaskWithAssignee } from "@shared/schema";
import { ListTodo, Calendar, Clock, CheckCircle, Circle, Loader2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

function TaskCard({ task, onStatusChange, isUpdating }: {
  task: TaskWithAssignee;
  onStatusChange: (taskId: string, status: TaskStatusType) => void;
  isUpdating: boolean;
}) {
  const statusIcons = {
    [TaskStatus.TODO]: Circle,
    [TaskStatus.IN_PROGRESS]: Clock,
    [TaskStatus.DONE]: CheckCircle,
  };

  const Icon = statusIcons[task.status];

  const statusColors = {
    [TaskStatus.TODO]: "border-l-muted-foreground",
    [TaskStatus.IN_PROGRESS]: "border-l-primary",
    [TaskStatus.DONE]: "border-l-green-500",
  };

  return (
    <Card
      className={cn("border-l-4 transition-all", statusColors[task.status])}
      data-testid={`task-card-${task.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <Icon className={cn(
              "h-5 w-5 mt-0.5 shrink-0",
              task.status === TaskStatus.DONE ? "text-green-500" :
              task.status === TaskStatus.IN_PROGRESS ? "text-primary" : "text-muted-foreground"
            )} />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-medium truncate">{task.title}</CardTitle>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
              )}
            </div>
          </div>
          <StatusBadge status={task.status} className="shrink-0" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Due {format(new Date(task.dueDate), "MMM d, yyyy")}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
            </div>
          </div>

          <Select
            value={task.status}
            onValueChange={(value: TaskStatusType) => onStatusChange(task.id, value)}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-36" data-testid={`select-task-status-${task.id}`}>
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SelectValue />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
              <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
              <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function TasksContent() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/tasks/my", statusFilter],
    queryFn: () => tasksApi.getMyTasks(1, 100, statusFilter === "all" ? undefined : statusFilter),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatusType }) =>
      tasksApi.updateStatus(id, { status }),
    onMutate: ({ id }) => {
      setUpdatingTaskId(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my"] });
      toast({ title: "Task status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update task", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      setUpdatingTaskId(null);
    },
  });

  const handleStatusChange = (taskId: string, status: TaskStatusType) => {
    updateStatusMutation.mutate({ id: taskId, status });
  };

  if (isLoading) {
    return <LoadingState message="Loading your tasks..." />;
  }

  if (error) {
    return <ErrorState message="Failed to load tasks" onRetry={() => refetch()} />;
  }

  const tasks = data?.data || [];

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === TaskStatus.TODO).length,
    inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    done: tasks.filter(t => t.status === TaskStatus.DONE).length,
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">My Tasks</h1>
        <p className="text-sm text-muted-foreground">View and update your assigned tasks</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-muted p-2">
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="stat-my-total">{taskStats.total}</p>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-muted p-2">
              <Circle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="stat-my-todo">{taskStats.todo}</p>
              <p className="text-xs text-muted-foreground">To Do</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-primary/10 p-2">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="stat-my-in-progress">{taskStats.inProgress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-green-500/10 p-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="stat-my-done">{taskStats.done}</p>
              <p className="text-xs text-muted-foreground">Done</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Task List</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-my-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
            <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
            <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks assigned"
          description={statusFilter === "all"
            ? "You don't have any tasks assigned yet. Tasks will appear here when an admin assigns them to you."
            : `No tasks with "${statusFilter.replace("_", " ").toLowerCase()}" status`
          }
        />
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              isUpdating={updatingTaskId === task.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MemberTasksPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.MEMBER}>
      <Layout title="My Tasks">
        <TasksContent />
      </Layout>
    </ProtectedRoute>
  );
}
