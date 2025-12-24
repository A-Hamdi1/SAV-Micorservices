import axiosInstance from './axios';
import { ApiResponse, AuthResponse, User, RegisterDto, LoginDto } from '../types';

export interface ForgotPasswordDto {
  email: string;
}

export interface VerifyOtpDto {
  email: string;
  otp: string;
}

export interface ResetPasswordDto {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

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

  // Password Reset
  forgotPassword: async (data: ForgotPasswordDto): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.post<ApiResponse<void>>('/api/auth/forgot-password', data);
    return response.data;
  },

  verifyOtp: async (data: VerifyOtpDto): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.post<ApiResponse<void>>('/api/auth/verify-otp', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordDto): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.post<ApiResponse<void>>('/api/auth/reset-password', data);
    return response.data;
  },
};

