import axiosInstance from './axios';
import {
  ApiResponse,
  TechnicienDto,
  TechnicienDetailsDto,
  CreateTechnicienDto,
  UpdateTechnicienDto,
  UpdateTechnicienDisponibiliteDto,
  TechnicienStatsDto,
  TechniciensStatsGlobalesDto,
  InterventionDto,
} from '../types';

export const techniciensApi = {
  getAllTechniciens: async (disponible?: boolean): Promise<ApiResponse<TechnicienDto[]>> => {
    const response = await axiosInstance.get<ApiResponse<TechnicienDto[]>>('/api/techniciens', {
      params: { disponible },
    });
    return response.data;
  },

  getTechnicienById: async (id: number): Promise<ApiResponse<TechnicienDetailsDto>> => {
    const response = await axiosInstance.get<ApiResponse<TechnicienDetailsDto>>(
      `/api/techniciens/${id}`
    );
    return response.data;
  },

  getTechniciensBySpecialite: async (specialite: string): Promise<ApiResponse<TechnicienDto[]>> => {
    const response = await axiosInstance.get<ApiResponse<TechnicienDto[]>>(
      `/api/techniciens/specialite/${specialite}`
    );
    return response.data;
  },

  getTechniciensDisponibles: async (): Promise<ApiResponse<TechnicienDto[]>> => {
    const response = await axiosInstance.get<ApiResponse<TechnicienDto[]>>(
      '/api/techniciens/disponibles'
    );
    return response.data;
  },

  createTechnicien: async (data: CreateTechnicienDto): Promise<ApiResponse<TechnicienDto>> => {
    const response = await axiosInstance.post<ApiResponse<TechnicienDto>>('/api/techniciens', data);
    return response.data;
  },

  updateTechnicien: async (
    id: number,
    data: UpdateTechnicienDto
  ): Promise<ApiResponse<TechnicienDto>> => {
    const response = await axiosInstance.put<ApiResponse<TechnicienDto>>(
      `/api/techniciens/${id}`,
      data
    );
    return response.data;
  },

  updateDisponibilite: async (
    id: number,
    data: UpdateTechnicienDisponibiliteDto
  ): Promise<ApiResponse<TechnicienDto>> => {
    const response = await axiosInstance.patch<ApiResponse<TechnicienDto>>(
      `/api/techniciens/${id}/disponibilite`,
      data
    );
    return response.data;
  },

  getTechnicienInterventions: async (
    id: number,
    statut?: string,
    dateDebut?: string,
    dateFin?: string
  ): Promise<ApiResponse<InterventionDto[]>> => {
    const response = await axiosInstance.get<ApiResponse<InterventionDto[]>>(
      `/api/techniciens/${id}/interventions`,
      {
        params: { statut, dateDebut, dateFin },
      }
    );
    return response.data;
  },

  getTechnicienStats: async (id: number): Promise<ApiResponse<TechnicienStatsDto>> => {
    const response = await axiosInstance.get<ApiResponse<TechnicienStatsDto>>(
      `/api/techniciens/${id}/stats`
    );
    return response.data;
  },

  deleteTechnicien: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/api/techniciens/${id}`);
    return response.data;
  },

  getTechniciensStatsGlobales: async (): Promise<ApiResponse<TechniciensStatsGlobalesDto>> => {
    const response = await axiosInstance.get<ApiResponse<TechniciensStatsGlobalesDto>>(
      '/api/techniciens/stats'
    );
    return response.data;
  },
};

