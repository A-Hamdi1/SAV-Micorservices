import axiosInstance from './axios';
import {
  ApiResponse,
  ClientDto,
  CreateClientDto,
  UpdateClientDto,
  CreateClientByResponsableDto,
} from '../types';

export const clientsApi = {
  getMyProfile: async (): Promise<ApiResponse<ClientDto>> => {
    const response = await axiosInstance.get<ApiResponse<ClientDto>>('/api/clients/me');
    return response.data;
  },

  createMyProfile: async (data: CreateClientDto): Promise<ApiResponse<ClientDto>> => {
    const response = await axiosInstance.post<ApiResponse<ClientDto>>('/api/clients/me', data);
    return response.data;
  },

  updateMyProfile: async (data: UpdateClientDto): Promise<ApiResponse<ClientDto>> => {
    const response = await axiosInstance.put<ApiResponse<ClientDto>>('/api/clients/me', data);
    return response.data;
  },

  getAllClients: async (page = 1, pageSize = 10): Promise<ApiResponse<ClientDto[]>> => {
    const response = await axiosInstance.get<ApiResponse<ClientDto[]>>('/api/clients', {
      params: { page, pageSize },
    });
    return response.data;
  },

  getClientById: async (id: number): Promise<ApiResponse<ClientDto>> => {
    const response = await axiosInstance.get<ApiResponse<ClientDto>>(`/api/clients/${id}`);
    return response.data;
  },

  createClient: async (data: CreateClientByResponsableDto): Promise<ApiResponse<ClientDto>> => {
    const response = await axiosInstance.post<ApiResponse<ClientDto>>('/api/clients', data);
    return response.data;
  },

  updateClient: async (id: number, data: UpdateClientDto): Promise<ApiResponse<ClientDto>> => {
    const response = await axiosInstance.put<ApiResponse<ClientDto>>(`/api/clients/${id}`, data);
    return response.data;
  },

  deleteClient: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/api/clients/${id}`);
    return response.data;
  },
};

