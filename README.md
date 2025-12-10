# Team Task Management System

A robust MERN-style task management application with full authentication, role-based access control (RBAC), and modern security features. Built with React, Express.js, and TypeScript.

---

## 🚀 Overview

TaskFlow is a scalable task management system designed with production-grade standards. It includes:

- JWT Authentication (Access + Refresh Tokens)
- Role-Based Access Control (ADMIN, MEMBER)
- Secure backend with rate limiting & helmet
- Modern frontend with React, Redux Toolkit & TanStack Query
- Admin dashboard + Member task board

---

## 🛠 Tech Stack

### Frontend
- React 18
- Redux Toolkit
- TanStack Query
- Tailwind CSS
- Shadcn UI

### Backend
- Express.js
- TypeScript
- Zod (validation)
- JWT (auth)
- bcryptjs

### Security
- Helmet
- express-rate-limit

---

## 🔐 User Roles

### ADMIN
- Full access
- Dashboard with stats
- User management (CRUD)
- Task management (CRUD + assign users)
- Profile management

### MEMBER
- View assigned tasks only
- Update task status (TODO → IN_PROGRESS → DONE)
- Update own profile

---

## 🔄 Authentication Flow

- User registers/logs in  
- Receives:
  - Access token (localStorage, 15 min expiry)
  - Refresh token (httpOnly cookie, 7 days expiry)
- Axios interceptor auto-refreshes access token  
- Logout invalidates refresh token on server  

---

## 📡 API Endpoints

### **Auth**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/logout | Logout (invalidate refresh token) |
| GET | /api/auth/me | Get current logged-in user |

### **Users (Admin only)**
| Method | Endpoint |
|--------|----------|
| GET | /api/users |
| POST | /api/users |
| PATCH | /api/users/:id |
| DELETE | /api/users/:id |
| PATCH | /api/users/profile (all users) |

### **Tasks**
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/tasks | Admin |
| GET | /api/tasks/my | Member |
| POST | /api/tasks | Admin |
| PATCH | /api/tasks/:id | Admin |
| PATCH | /api/tasks/:id/status | Assigned member |
| DELETE | /api/tasks/:id | Admin |

---

## 👤 Default Admin Credentials
```
Email: admin@taskflow.com
Password: admin123
```

---

## 🧪 Development Setup

### Start Backend
```
cd server
npm install
npm run dev
```
### Start Frontend
```
cd client
npm install
npm run dev
```


