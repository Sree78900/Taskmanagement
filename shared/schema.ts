import { z } from "zod";

export const UserRole = {
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const TaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  role: UserRoleType;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatusType;
  assignedTo: string;
  createdBy: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum([UserRole.ADMIN, UserRole.MEMBER]),
});

export const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  role: z.enum([UserRole.ADMIN, UserRole.MEMBER]).optional(),
});

export const updateProfileSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters").optional(),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: "Current password is required to set new password",
  path: ["currentPassword"],
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  status: z.enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE]).default(TaskStatus.TODO),
  assignedTo: z.string().min(1, "Assignee is required"),
  dueDate: z.string().nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  status: z.enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE]).optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().nullable().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;

export interface UserPublic {
  id: string;
  email: string;
  username: string;
  role: UserRoleType;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

export interface AuthResponse {
  user: UserPublic;
  accessToken: string;
}

export interface TaskWithAssignee extends Task {
  assignee?: UserPublic;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
