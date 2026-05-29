import type { Task, User } from './App';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'authToken';

type ServerRole = 'member' | 'organization';
type ServerStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
type ServerPriority = 'LOW' | 'MEDIUM' | 'HIGH';

type ServerUser = {
  id: string;
  name: string;
  email: string;
  role: ServerRole;
  organization_id?: string | null;
};

type ServerTask = {
  id: string;
  title: string;
  description: string | null;
  status: ServerStatus;
  priority: ServerPriority;
  due_date: string;
  user_id: string;
  organization_id: string | null;
  assigned_to: string | null;
  created_at: string;
};

type AuthResponse = {
  user: ServerUser;
  token: string;
};

export type OrganizationOption = {
  id: string;
  name: string;
};

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function mapUser(user: ServerUser): User {
  const isOrganization = user.role === 'organization';
  const organizationId = isOrganization ? user.id : user.organization_id ?? null;

  return {
    id: user.id,
    email: user.email,
    name: user.name.replaceAll('_', ' '),
    role: isOrganization ? 'admin' : 'member',
    organizationId,
    organizationName: organizationId ? (isOrganization ? user.name.replaceAll('_', ' ') : organizationId) : null,
    membershipStatus: organizationId ? 'approved' : null,
  };
}

function mapStatus(status: ServerStatus): Task['status'] {
  return status === 'COMPLETED' ? 'completed' : 'pending';
}

function toServerStatus(status: Task['status']): ServerStatus {
  return status === 'completed' ? 'COMPLETED' : 'TODO';
}

function mapPriority(priority: ServerPriority): Task['priority'] {
  return priority.toLowerCase() as Task['priority'];
}

function toServerPriority(priority: Task['priority']): ServerPriority {
  return priority.toUpperCase() as ServerPriority;
}

function mapTask(task: ServerTask): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? '',
    status: mapStatus(task.status),
    priority: mapPriority(task.priority),
    dueDate: task.due_date,
    userId: task.user_id,
    type: task.organization_id ? 'organization' : 'personal',
    organizationId: task.organization_id,
    assignedTo: task.assigned_to,
    createdAt: task.created_at,
  };
}

async function request<T>(path: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? 'Request failed');
  }

  return payload as T;
}

function splitName(name: string) {
  const [firstName, ...rest] = name.trim().split(/\s+/);

  return {
    firstName: firstName || name.trim(),
    lastName: rest.join(' ') || 'User',
  };
}

export async function login(email: string, password: string) {
  const response = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  setStoredToken(response.token);
  return mapUser(response.user);
}

export async function signup(input: {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'member';
  organizationId?: string;
}) {
  const { firstName, lastName } = splitName(input.name);
  const response = await request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      firstName,
      lastName,
      password: input.password,
      confirmationPass: input.password,
      role: input.role === 'admin' ? 'organization' : 'member',
      organizationId: input.organizationId || undefined,
    }),
  });

  setStoredToken(response.token);
  return mapUser(response.user);
}

export async function getCurrentUser() {
  return mapUser(await request<ServerUser>('/users/me'));
}

export async function updateProfile(input: { name: string; email: string }) {
  return mapUser(await request<ServerUser>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  }));
}

export async function updateOrganization(organizationId: string | null) {
  return mapUser(await request<ServerUser>('/users/me/organization', {
    method: 'PATCH',
    body: JSON.stringify({ organizationId }),
  }));
}

export async function deleteAccount() {
  await request('/users/me', { method: 'DELETE' });
  clearStoredToken();
}

export async function listOrganizations() {
  return request<OrganizationOption[]>('/users/organizations');
}

export async function listMyTasks() {
  return (await request<ServerTask[]>('/tasks')).map(mapTask);
}

export async function createTask(input: {
  title: string;
  description: string;
  priority: Task['priority'];
  dueDate: string;
}) {
  return mapTask(await request<ServerTask>('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      priority: toServerPriority(input.priority),
    }),
  }));
}

export async function getTask(id: string) {
  return mapTask(await request<ServerTask>(`/tasks/${id}`));
}

export async function updateTask(id: string, input: {
  title?: string;
  description?: string;
  priority?: Task['priority'];
  dueDate?: string;
  status?: Task['status'];
}) {
  return mapTask(await request<ServerTask>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...input,
      priority: input.priority ? toServerPriority(input.priority) : undefined,
      status: input.status ? toServerStatus(input.status) : undefined,
    }),
  }));
}

export async function deleteTask(id: string) {
  await request(`/tasks/${id}`, { method: 'DELETE' });
}

export async function completeTask(id: string) {
  return mapTask(await request<ServerTask>(`/tasks/${id}/complete`, {
    method: 'PATCH',
  }));
}

export async function listOrganizationTasks() {
  return (await request<ServerTask[]>('/tasks/organization')).map(mapTask);
}

export async function createOrganizationTask(input: {
  title: string;
  description: string;
  priority: Task['priority'];
  dueDate: string;
}) {
  return mapTask(await request<ServerTask>('/tasks/organization', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      priority: toServerPriority(input.priority),
    }),
  }));
}

export async function listAvailableOrganizationTasks() {
  return (await request<ServerTask[]>('/tasks/organization/available')).map(mapTask);
}

export async function takeOrganizationTask(id: string) {
  return mapTask(await request<ServerTask>(`/tasks/organization/${id}/take`, {
    method: 'PATCH',
  }));
}
