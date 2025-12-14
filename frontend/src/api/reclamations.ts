import axiosInstance from './axios';
import {
  ApiResponse,
  ReclamationDto,
  CreateReclamationDto,
  UpdateReclamationStatutDto,
  ReclamationListDto,
} from '../types';

export const reclamationsApi = {
  createReclamation: async (data: CreateReclamationDto): Promise<ApiResponse<ReclamationDto>> => {
    const response = await axiosInstance.post<ApiResponse<ReclamationDto>>('/api/reclamations', data);
    return response.data;
  },

  getMyReclamations: async (): Promise<ApiResponse<ReclamationDto[]>> => {
    const response = await axiosInstance.get<ApiResponse<ReclamationDto[]>>('/api/reclamations/me');
    return response.data;
  },

  getAllReclamations: async (
    page = 1,
    pageSize = 10,
    statut?: string
  ): Promise<ApiResponse<ReclamationListDto>> => {
    const response = await axiosInstance.get<ApiResponse<ReclamationListDto>>('/api/reclamations', {
      params: { page, pageSize, statut },
    });
    return response.data;
  },

  getReclamationById: async (id: number): Promise<ApiResponse<ReclamationDto>> => {
    const response = await axiosInstance.get<ApiResponse<ReclamationDto>>(`/api/reclamations/${id}`);
    return response.data;
  },

  getReclamationsByClientId: async (clientId: number): Promise<ApiResponse<ReclamationDto[]>> => {
    const response = await axiosInstance.get<ApiResponse<ReclamationDto[]>>(
      `/api/reclamations/client/${clientId}`
    );
    return response.data;
  },

  updateReclamationStatut: async (
    id: number,
    data: UpdateReclamationStatutDto
  ): Promise<ApiResponse<ReclamationDto>> => {
    const response = await axiosInstance.put<ApiResponse<ReclamationDto>>(
      `/api/reclamations/${id}/statut`,
      data
    );
    return response.data;
  },

  deleteReclamation: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/api/reclamations/${id}`);
    return response.data;
  },
};

