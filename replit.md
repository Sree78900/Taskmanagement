# TaskFlow - Production-Grade Task Management System

## Overview
TaskFlow is a production-grade MERN-style task management application with comprehensive authentication, role-based access control (RBAC), and security features. Built with React, Express.js, and TypeScript.

## Recent Changes
- December 8, 2025: Initial MVP implementation complete
  - JWT authentication with access + refresh tokens
  - Role-based access control (ADMIN, MEMBER)
  - Password hashing with bcrypt
  - Rate limiting on auth routes
  - Admin dashboard with user and task management
  - Member task board with status updates

## Tech Stack
- **Frontend**: React 18, Redux Toolkit, TanStack Query, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, TypeScript
- **Authentication**: JWT (access + refresh tokens), bcryptjs
- **Validation**: Zod
- **Security**: Helmet, express-rate-limit

## Project Architecture

### Directory Structure
```
client/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── ui/         # Shadcn UI components
│   │   ├── app-sidebar.tsx
│   │   ├── layout.tsx
│   │   ├── protected-route.tsx
│   │   └── theme-provider.tsx
│   ├── lib/            # Utilities and API layer
│   │   ├── api.ts      # Axios abstraction layer
│   │   └── queryClient.ts
│   ├── pages/          # Page components
│   │   ├── admin/      # Admin pages (dashboard, users, tasks, profile)
│   │   └── member/     # Member pages (tasks, profile)
│   ├── store/          # Redux store
│   │   ├── authSlice.ts
│   │   └── hooks.ts
│   └── App.tsx
server/
├── middleware/
│   ├── auth.ts         # JWT authentication middleware
│   └── errorHandler.ts # Centralized error handling
├── routes.ts           # API routes
├── storage.ts          # In-memory storage interface
└── index.ts           # Express server setup
shared/
└── schema.ts           # Shared TypeScript types and Zod schemas
```

### User Roles
1. **ADMIN**: Full access to all features
   - Dashboard with statistics
   - User management (CRUD)
   - Task management (CRUD, assign to users)
   - Profile management

2. **MEMBER**: Limited access
   - View assigned tasks only
   - Update task status (TODO, IN_PROGRESS, DONE)
   - Profile management

### Authentication Flow
1. User registers/logs in → receives access token + refresh token
2. Access token stored in localStorage (15min expiry)
3. Refresh token stored in httpOnly cookie (7 days expiry)
4. Token auto-refresh via interceptor when access token expires
5. Logout invalidates refresh token on server

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (invalidates refresh token)
- `GET /api/auth/me` - Get current user

- `GET /api/users` - List users (Admin only)
- `POST /api/users` - Create user (Admin only)
- `PATCH /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)
- `PATCH /api/users/profile` - Update own profile

- `GET /api/tasks` - List all tasks (Admin only)
- `GET /api/tasks/my` - List user's tasks (Member)
- `POST /api/tasks` - Create task (Admin only)
- `PATCH /api/tasks/:id` - Update task (Admin only)
- `PATCH /api/tasks/:id/status` - Update task status (Owner only)
- `DELETE /api/tasks/:id` - Delete task (Admin only)

## Default Admin Account
- Email: admin@taskflow.com
- Password: admin123

## Development
The application runs on port 5000 with `npm run dev`.
