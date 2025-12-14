import axiosInstance from './axios';
import { ApiResponse, AuthResponse, User, RegisterDto, LoginDto } from '../types';

export const authApi = {
  register: async (data: RegisterDto): Promise<ApiResponse<AuthResponse>> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/api/auth/register', data);
    return response.data;
  },

  login: async (data: LoginDto): Promise<ApiResponse<AuthResponse>> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/api/auth/login', data);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/api/auth/refresh-token', {
      refreshToken,
    });
    return response.data;
  },

  revokeToken: async (refreshToken: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.post<ApiResponse<void>>('/api/auth/revoke-token', {
      refreshToken,
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await axiosInstance.get<ApiResponse<User>>('/api/auth/me');
    return response.data;
  },
};

