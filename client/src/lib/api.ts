import axios from 'axios';
import type { User, Chat, Message, AuthResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (username: string, displayName: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/register', {
      username,
      displayName,
      password,
    });
    return response.data;
  },

  login: async (username: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', {
      username,
      password,
    });
    return response.data;
  },
};

export const usersAPI = {
  search: async (username: string) => {
    const response = await api.get<User[]>(`/users/search?username=${username}`);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },
};

export const chatsAPI = {
  getAll: async () => {
    const response = await api.get<Chat[]>('/chats');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Chat>(`/chats/${id}`);
    return response.data;
  },

  createDirect: async (userId: string) => {
    const response = await api.post<Chat>('/chats/direct', { userId });
    return response.data;
  },
};

export const messagesAPI = {
  getByChatId: async (chatId: string, limit?: number, before?: string) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (before) params.append('before', before);
    const response = await api.get<Message[]>(`/messages/${chatId}?${params}`);
    return response.data;
  },
};

export default api;
