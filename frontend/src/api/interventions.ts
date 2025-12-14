import axiosInstance from './axios';
import {
  ApiResponse,
  InterventionDto,
  CreateInterventionDto,
  UpdateInterventionDto,
  UpdateInterventionStatutDto,
  InterventionListDto,
  PieceUtiliseeDto,
  AddPieceUtiliseeDto,
  UpdateInterventionTechnicienDto,
  InterventionStatsDto,
} from '../types';

export const interventionsApi = {
  createIntervention: async (data: CreateInterventionDto): Promise<ApiResponse<InterventionDto>> => {
    const response = await axiosInstance.post<ApiResponse<InterventionDto>>('/api/interventions', data);
    return response.data;
  },

  getAllInterventions: async (
    page = 1,
    pageSize = 10,
    statut?: string
  ): Promise<ApiResponse<InterventionListDto>> => {
    const response = await axiosInstance.get<ApiResponse<InterventionListDto>>('/api/interventions', {
      params: { page, pageSize, statut },
    });
    return response.data;
  },

  getInterventionById: async (id: number): Promise<ApiResponse<InterventionDto>> => {
    const response = await axiosInstance.get<ApiResponse<InterventionDto>>(`/api/interventions/${id}`);
    return response.data;
  },

  updateIntervention: async (
    id: number,
    data: UpdateInterventionDto
  ): Promise<ApiResponse<InterventionDto>> => {
    const response = await axiosInstance.put<ApiResponse<InterventionDto>>(
      `/api/interventions/${id}`,
      data
    );
    return response.data;
  },

  updateInterventionStatut: async (
    id: number,
    data: UpdateInterventionStatutDto
  ): Promise<ApiResponse<InterventionDto>> => {
    const response = await axiosInstance.put<ApiResponse<InterventionDto>>(
      `/api/interventions/${id}/statut`,
      data
    );
    return response.data;
  },

  addPieceUtilisee: async (
    id: number,
    data: AddPieceUtiliseeDto
  ): Promise<ApiResponse<PieceUtiliseeDto>> => {
    const response = await axiosInstance.post<ApiResponse<PieceUtiliseeDto>>(
      `/api/interventions/${id}/pieces`,
      data
    );
    return response.data;
  },

  getInterventionsByReclamation: async (
    reclamationId: number
  ): Promise<ApiResponse<InterventionDto[]>> => {
    const response = await axiosInstance.get<ApiResponse<InterventionDto[]>>(
      `/api/interventions/reclamation/${reclamationId}`
    );
    return response.data;
  },

  getInterventionsByTechnicien: async (
    technicienId: number
  ): Promise<ApiResponse<InterventionDto[]>> => {
    const response = await axiosInstance.get<ApiResponse<InterventionDto[]>>(
      `/api/interventions/technicien/${technicienId}`
    );
    return response.data;
  },

  getInterventionsPlanifiees: async (): Promise<ApiResponse<InterventionDto[]>> => {
    const response = await axiosInstance.get<ApiResponse<InterventionDto[]>>(
      '/api/interventions/planifiees'
    );
    return response.data;
  },

  updateInterventionTechnicien: async (
    id: number,
    data: UpdateInterventionTechnicienDto
  ): Promise<ApiResponse<InterventionDto>> => {
    const response = await axiosInstance.patch<ApiResponse<InterventionDto>>(
      `/api/interventions/${id}/technicien`,
      data
    );
    return response.data;
  },

  deleteIntervention: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/api/interventions/${id}`);
    return response.data;
  },

  genererFacture: async (id: number): Promise<ApiResponse<string>> => {
    const response = await axiosInstance.get<ApiResponse<string>>(`/api/interventions/${id}/facture`);
    return response.data;
  },

  getInterventionsStats: async (): Promise<ApiResponse<InterventionStatsDto>> => {
    const response = await axiosInstance.get<ApiResponse<InterventionStatsDto>>(
      '/api/interventions/stats'
    );
    return response.data;
  },
};

