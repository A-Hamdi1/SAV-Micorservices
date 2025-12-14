import axiosInstance from './axios';
import {
  ApiResponse,
  ArticleAchatDto,
  CreateArticleAchatDto,
  UpdateArticleAchatDto,
  ArticleAchatStatsDto,
} from '../types';

export const articlesAchetesApi = {
  getMyArticles: async (): Promise<ApiResponse<ArticleAchatDto[]>> => {
    const response = await axiosInstance.get<ApiResponse<ArticleAchatDto[]>>(
      '/api/articles-achetes/me'
    );
    return response.data;
  },

  createArticleAchat: async (
    data: CreateArticleAchatDto
  ): Promise<ApiResponse<ArticleAchatDto>> => {
    const response = await axiosInstance.post<ApiResponse<ArticleAchatDto>>(
      '/api/articles-achetes/me',
      data
    );
    return response.data;
  },

  checkGarantie: async (id: number): Promise<ApiResponse<boolean>> => {
    const response = await axiosInstance.get<ApiResponse<boolean>>(
      `/api/articles-achetes/${id}/garantie`
    );
    return response.data;
  },

  getAllArticlesAchates: async (
    page = 1,
    pageSize = 10,
    clientId?: number,
    sousGarantie?: boolean
  ): Promise<ApiResponse<ArticleAchatDto[]>> => {
    const response = await axiosInstance.get<ApiResponse<ArticleAchatDto[]>>(
      '/api/articles-achetes',
      {
        params: { page, pageSize, clientId, sousGarantie },
      }
    );
    return response.data;
  },

  getArticleAchatById: async (id: number): Promise<ApiResponse<ArticleAchatDto>> => {
    const response = await axiosInstance.get<ApiResponse<ArticleAchatDto>>(
      `/api/articles-achetes/${id}`
    );
    return response.data;
  },

  getArticlesByClientId: async (clientId: number): Promise<ApiResponse<ArticleAchatDto[]>> => {
    const response = await axiosInstance.get<ApiResponse<ArticleAchatDto[]>>(
      `/api/articles-achetes/client/${clientId}`
    );
    return response.data;
  },

  getArticlesSousGarantieByClientId: async (
    clientId: number
  ): Promise<ApiResponse<ArticleAchatDto[]>> => {
    const response = await axiosInstance.get<ApiResponse<ArticleAchatDto[]>>(
      `/api/articles-achetes/client/${clientId}/garantie`
    );
    return response.data;
  },

  getArticleByNumeroSerie: async (
    numeroSerie: string
  ): Promise<ApiResponse<ArticleAchatDto>> => {
    const response = await axiosInstance.get<ApiResponse<ArticleAchatDto>>(
      `/api/articles-achetes/garantie/${numeroSerie}`
    );
    return response.data;
  },

  updateArticleAchat: async (
    id: number,
    data: UpdateArticleAchatDto
  ): Promise<ApiResponse<ArticleAchatDto>> => {
    const response = await axiosInstance.put<ApiResponse<ArticleAchatDto>>(
      `/api/articles-achetes/${id}`,
      data
    );
    return response.data;
  },

  deleteArticleAchat: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/api/articles-achetes/${id}`);
    return response.data;
  },

  getGarantieStats: async (): Promise<ApiResponse<ArticleAchatStatsDto>> => {
    const response = await axiosInstance.get<ApiResponse<ArticleAchatStatsDto>>(
      '/api/articles-achetes/stats/garanties'
    );
    return response.data;
  },
};

