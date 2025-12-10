import {
  type User,
  type Task,
  type RefreshToken,
  type UserPublic,
  type TaskWithAssignee,
  type PaginatedResponse,
  UserRole,
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id" | "createdAt">): Promise<User>;
  updateUser(id: string, data: Partial<Omit<User, "id" | "createdAt">>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(page: number, limit: number): Promise<PaginatedResponse<UserPublic>>;

  getTask(id: string): Promise<Task | undefined>;
  getTaskWithAssignee(id: string): Promise<TaskWithAssignee | undefined>;
  createTask(task: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task>;
  updateTask(id: string, data: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  getAllTasks(page: number, limit: number, status?: string): Promise<PaginatedResponse<TaskWithAssignee>>;
  getTasksByUser(userId: string, page: number, limit: number, status?: string): Promise<PaginatedResponse<TaskWithAssignee>>;

  createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken>;
  getRefreshToken(token: string): Promise<RefreshToken | undefined>;
  deleteRefreshToken(token: string): Promise<boolean>;
  deleteRefreshTokensByUser(userId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tasks: Map<string, Task>;
  private refreshTokens: Map<string, RefreshToken>;
  private initialized: boolean = false;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.refreshTokens = new Map();
  }

  async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const adminUser: User = {
      id: randomUUID(),
      email: "admin@taskflow.com",
      username: "admin",
      password: hashedPassword,
      role: UserRole.ADMIN,
      firstName: "System",
      lastName: "Admin",
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);
  }

  private toPublicUser(user: User): UserPublic {
    const { password, ...publicUser } = user;
    return publicUser;
  }

  async getUser(id: string): Promise<User | undefined> {
    await this.ensureInitialized();
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await this.ensureInitialized();
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.ensureInitialized();
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
    await this.ensureInitialized();
    const id = randomUUID();
    const user: User = {
      ...userData,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<Omit<User, "id" | "createdAt">>): Promise<User | undefined> {
    await this.ensureInitialized();
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    await this.ensureInitialized();
    return this.users.delete(id);
  }

  async getAllUsers(page: number, limit: number): Promise<PaginatedResponse<UserPublic>> {
    await this.ensureInitialized();
    const allUsers = Array.from(this.users.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = allUsers.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = allUsers.slice(offset, offset + limit).map(this.toPublicUser);

    return { data, total, page, limit, totalPages };
  }

  async getTask(id: string): Promise<Task | undefined> {
    await this.ensureInitialized();
    return this.tasks.get(id);
  }

  async getTaskWithAssignee(id: string): Promise<TaskWithAssignee | undefined> {
    await this.ensureInitialized();
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const assignee = this.users.get(task.assignedTo);
    return {
      ...task,
      assignee: assignee ? this.toPublicUser(assignee) : undefined,
    };
  }

  async createTask(taskData: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task> {
    await this.ensureInitialized();
    const id = randomUUID();
    const now = new Date();
    const task: Task = {
      ...taskData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, data: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>): Promise<Task | undefined> {
    await this.ensureInitialized();
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask: Task = {
      ...task,
      ...data,
      updatedAt: new Date(),
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    await this.ensureInitialized();
    return this.tasks.delete(id);
  }

  async getAllTasks(page: number, limit: number, status?: string): Promise<PaginatedResponse<TaskWithAssignee>> {
    await this.ensureInitialized();
    let allTasks = Array.from(this.tasks.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (status) {
      allTasks = allTasks.filter((task) => task.status === status);
    }

    const total = allTasks.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginatedTasks = allTasks.slice(offset, offset + limit);

    const data: TaskWithAssignee[] = paginatedTasks.map((task) => {
      const assignee = this.users.get(task.assignedTo);
      return {
        ...task,
        assignee: assignee ? this.toPublicUser(assignee) : undefined,
      };
    });

    return { data, total, page, limit, totalPages };
  }

  async getTasksByUser(userId: string, page: number, limit: number, status?: string): Promise<PaginatedResponse<TaskWithAssignee>> {
    await this.ensureInitialized();
    let userTasks = Array.from(this.tasks.values())
      .filter((task) => task.assignedTo === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (status) {
      userTasks = userTasks.filter((task) => task.status === status);
    }

    const total = userTasks.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginatedTasks = userTasks.slice(offset, offset + limit);

    const assignee = this.users.get(userId);
    const data: TaskWithAssignee[] = paginatedTasks.map((task) => ({
      ...task,
      assignee: assignee ? this.toPublicUser(assignee) : undefined,
    }));

    return { data, total, page, limit, totalPages };
  }

  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    await this.ensureInitialized();
    const id = randomUUID();
    const refreshToken: RefreshToken = {
      id,
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
    };
    this.refreshTokens.set(token, refreshToken);
    return refreshToken;
  }

  async getRefreshToken(token: string): Promise<RefreshToken | undefined> {
    await this.ensureInitialized();
    return this.refreshTokens.get(token);
  }

  async deleteRefreshToken(token: string): Promise<boolean> {
    await this.ensureInitialized();
    return this.refreshTokens.delete(token);
  }

  async deleteRefreshTokensByUser(userId: string): Promise<boolean> {
    await this.ensureInitialized();
    const tokensToDelete = Array.from(this.refreshTokens.values())
      .filter((token) => token.userId === userId);

    for (const token of tokensToDelete) {
      this.refreshTokens.delete(token.token);
    }
    return true;
  }
}

export const storage = new MemStorage();
