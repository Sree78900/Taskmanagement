import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import {
  authenticate,
  requireAdmin,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  type AuthRequest,
} from "./middleware/auth";
import { AppError, errorHandler } from "./middleware/errorHandler";
import {
  registerSchema,
  loginSchema,
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  UserRole,
  TaskStatus,
} from "@shared/schema";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/auth/register", authLimiter, async (req, res, next) => {
    try {
      const data = registerSchema.parse(req.body);

      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        throw new AppError(400, "Email already registered");
      }

      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        throw new AppError(400, "Username already taken");
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        email: data.email,
        username: data.username,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: UserRole.MEMBER,
      });

      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await storage.createRefreshToken(user.id, refreshToken, expiresAt);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const { password, ...publicUser } = user;
      res.status(201).json({ user: publicUser, accessToken });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", authLimiter, async (req, res, next) => {
    try {
      const data = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        throw new AppError(401, "Invalid email or password");
      }

      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        throw new AppError(401, "Invalid email or password");
      }

      await storage.deleteRefreshTokensByUser(user.id);

      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await storage.createRefreshToken(user.id, refreshToken, expiresAt);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const { password, ...publicUser } = user;
      res.json({ user: publicUser, accessToken });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/refresh", authLimiter, async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        throw new AppError(401, "No refresh token provided");
      }

      const storedToken = await storage.getRefreshToken(refreshToken);
      if (!storedToken) {
        throw new AppError(401, "Invalid refresh token");
      }

      if (new Date() > storedToken.expiresAt) {
        await storage.deleteRefreshToken(refreshToken);
        throw new AppError(401, "Refresh token expired");
      }

      const decoded = verifyToken(refreshToken);
      if (!decoded) {
        await storage.deleteRefreshToken(refreshToken);
        throw new AppError(401, "Invalid refresh token");
      }

      const user = await storage.getUser(decoded.userId);
      if (!user) {
        throw new AppError(401, "User not found");
      }

      const accessToken = generateAccessToken(user.id);
      res.json({ accessToken });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/logout", authenticate, async (req: AuthRequest, res, next) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        await storage.deleteRefreshToken(refreshToken);
      }

      if (req.user) {
        await storage.deleteRefreshTokensByUser(req.user.id);
      }

      res.clearCookie("refreshToken");
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/me", authenticate, async (req: AuthRequest, res) => {
    res.json(req.user);
  });

  app.get("/api/users", authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const users = await storage.getAllUsers(page, limit);
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/users/:id", authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        throw new AppError(404, "User not found");
      }

      const { password, ...publicUser } = user;
      res.json(publicUser);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/users", authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
      const data = createUserSchema.parse(req.body);

      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        throw new AppError(400, "Email already registered");
      }

      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        throw new AppError(400, "Username already taken");
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        email: data.email,
        username: data.username,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      });

      const { password, ...publicUser } = user;
      res.status(201).json(publicUser);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/users/profile", authenticate, async (req: AuthRequest, res, next) => {
    try {
      const data = updateProfileSchema.parse(req.body);
      const userId = req.user!.id;

      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        throw new AppError(404, "User not found");
      }

      if (data.email && data.email !== existingUser.email) {
        const emailUser = await storage.getUserByEmail(data.email);
        if (emailUser) {
          throw new AppError(400, "Email already registered");
        }
      }

      if (data.username && data.username !== existingUser.username) {
        const usernameUser = await storage.getUserByUsername(data.username);
        if (usernameUser) {
          throw new AppError(400, "Username already taken");
        }
      }

      const updateData: Record<string, string> = {};
      if (data.email) updateData.email = data.email;
      if (data.username) updateData.username = data.username;
      if (data.firstName) updateData.firstName = data.firstName;
      if (data.lastName) updateData.lastName = data.lastName;

      if (data.newPassword) {
        if (!data.currentPassword) {
          throw new AppError(400, "Current password is required");
        }

        const validPassword = await bcrypt.compare(data.currentPassword, existingUser.password);
        if (!validPassword) {
          throw new AppError(400, "Current password is incorrect");
        }

        updateData.password = await bcrypt.hash(data.newPassword, 10);
      }

      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        throw new AppError(404, "User not found");
      }

      const { password, ...publicUser } = updatedUser;
      res.json(publicUser);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/users/:id", authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
      const data = updateUserSchema.parse(req.body);

      const existingUser = await storage.getUser(req.params.id);
      if (!existingUser) {
        throw new AppError(404, "User not found");
      }

      if (data.email && data.email !== existingUser.email) {
        const emailUser = await storage.getUserByEmail(data.email);
        if (emailUser) {
          throw new AppError(400, "Email already registered");
        }
      }

      if (data.username && data.username !== existingUser.username) {
        const usernameUser = await storage.getUserByUsername(data.username);
        if (usernameUser) {
          throw new AppError(400, "Username already taken");
        }
      }

      const updatedUser = await storage.updateUser(req.params.id, data);
      if (!updatedUser) {
        throw new AppError(404, "User not found");
      }

      const { password, ...publicUser } = updatedUser;
      res.json(publicUser);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/users/:id", authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
      if (req.user?.id === req.params.id) {
        throw new AppError(400, "Cannot delete your own account");
      }

      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        throw new AppError(404, "User not found");
      }

      await storage.deleteRefreshTokensByUser(req.params.id);

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/tasks", authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;

      const tasks = await storage.getAllTasks(page, limit, status);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/tasks/my", authenticate, async (req: AuthRequest, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;

      const tasks = await storage.getTasksByUser(req.user!.id, page, limit, status);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/tasks/:id", authenticate, async (req: AuthRequest, res, next) => {
    try {
      const task = await storage.getTaskWithAssignee(req.params.id);
      if (!task) {
        throw new AppError(404, "Task not found");
      }

      if (req.user!.role !== UserRole.ADMIN && task.assignedTo !== req.user!.id) {
        throw new AppError(403, "Not authorized to view this task");
      }

      res.json(task);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tasks", authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
      const data = createTaskSchema.parse(req.body);

      const assignee = await storage.getUser(data.assignedTo);
      if (!assignee) {
        throw new AppError(400, "Assignee not found");
      }

      const task = await storage.createTask({
        title: data.title,
        description: data.description || "",
        status: data.status || TaskStatus.TODO,
        assignedTo: data.assignedTo,
        createdBy: req.user!.id,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      });

      const taskWithAssignee = await storage.getTaskWithAssignee(task.id);
      res.status(201).json(taskWithAssignee);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/tasks/:id", authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
      const data = updateTaskSchema.parse(req.body);

      const existingTask = await storage.getTask(req.params.id);
      if (!existingTask) {
        throw new AppError(404, "Task not found");
      }

      if (data.assignedTo) {
        const assignee = await storage.getUser(data.assignedTo);
        if (!assignee) {
          throw new AppError(400, "Assignee not found");
        }
      }

      const updateData: Record<string, any> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
      if (data.dueDate !== undefined) {
        updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
      }

      const updatedTask = await storage.updateTask(req.params.id, updateData);
      if (!updatedTask) {
        throw new AppError(404, "Task not found");
      }

      const taskWithAssignee = await storage.getTaskWithAssignee(updatedTask.id);
      res.json(taskWithAssignee);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/tasks/:id/status", authenticate, async (req: AuthRequest, res, next) => {
    try {
      const data = updateTaskStatusSchema.parse(req.body);

      const existingTask = await storage.getTask(req.params.id);
      if (!existingTask) {
        throw new AppError(404, "Task not found");
      }

      if (req.user!.role !== UserRole.ADMIN && existingTask.assignedTo !== req.user!.id) {
        throw new AppError(403, "Not authorized to update this task");
      }

      const updatedTask = await storage.updateTask(req.params.id, { status: data.status });
      if (!updatedTask) {
        throw new AppError(404, "Task not found");
      }

      const taskWithAssignee = await storage.getTaskWithAssignee(updatedTask.id);
      res.json(taskWithAssignee);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/tasks/:id", authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
      const deleted = await storage.deleteTask(req.params.id);
      if (!deleted) {
        throw new AppError(404, "Task not found");
      }

      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.use(errorHandler);

  return httpServer;
}
