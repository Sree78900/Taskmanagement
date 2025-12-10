import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  CreateUserInput,
  UpdateUserInput,
  UpdateProfileInput,
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
  UserPublic,
  TaskWithAssignee,
  PaginatedResponse,
} from "@shared/schema";

const API_BASE = "/api";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, errorData.message || "An error occurred");
  }
  return response.json();
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("accessToken");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) return null;
    const data = await response.json();
    localStorage.setItem("accessToken", data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders: HeadersInit = {
        ...headers,
        Authorization: `Bearer ${newToken}`,
      };
      response = await fetch(url, {
        ...options,
        headers: retryHeaders,
        credentials: "include",
      });
    }
  }

  return handleResponse<T>(response);
}

export const authApi = {
  register: (data: RegisterInput): Promise<AuthResponse> =>
    fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    }).then(handleResponse),

  login: (data: LoginInput): Promise<AuthResponse> =>
    fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    }).then(handleResponse),

  logout: (): Promise<void> =>
    fetchWithAuth(`${API_BASE}/auth/logout`, { method: "POST" }),

  me: (): Promise<UserPublic> =>
    fetchWithAuth(`${API_BASE}/auth/me`),

  refresh: (): Promise<{ accessToken: string }> =>
    fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    }).then(handleResponse),
};

export const usersApi = {
  getAll: (page = 1, limit = 10): Promise<PaginatedResponse<UserPublic>> =>
    fetchWithAuth(`${API_BASE}/users?page=${page}&limit=${limit}`),

  getById: (id: string): Promise<UserPublic> =>
    fetchWithAuth(`${API_BASE}/users/${id}`),

  create: (data: CreateUserInput): Promise<UserPublic> =>
    fetchWithAuth(`${API_BASE}/users`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateUserInput): Promise<UserPublic> =>
    fetchWithAuth(`${API_BASE}/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    fetchWithAuth(`${API_BASE}/users/${id}`, { method: "DELETE" }),

  updateProfile: (data: UpdateProfileInput): Promise<UserPublic> =>
    fetchWithAuth(`${API_BASE}/users/profile`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export const tasksApi = {
  getAll: (page = 1, limit = 10, status?: string): Promise<PaginatedResponse<TaskWithAssignee>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append("status", status);
    return fetchWithAuth(`${API_BASE}/tasks?${params}`);
  },

  getMyTasks: (page = 1, limit = 10, status?: string): Promise<PaginatedResponse<TaskWithAssignee>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append("status", status);
    return fetchWithAuth(`${API_BASE}/tasks/my?${params}`);
  },

  getById: (id: string): Promise<TaskWithAssignee> =>
    fetchWithAuth(`${API_BASE}/tasks/${id}`),

  create: (data: CreateTaskInput): Promise<TaskWithAssignee> =>
    fetchWithAuth(`${API_BASE}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateTaskInput): Promise<TaskWithAssignee> =>
    fetchWithAuth(`${API_BASE}/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, data: UpdateTaskStatusInput): Promise<TaskWithAssignee> =>
    fetchWithAuth(`${API_BASE}/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    fetchWithAuth(`${API_BASE}/tasks/${id}`, { method: "DELETE" }),
};

export { ApiError };
