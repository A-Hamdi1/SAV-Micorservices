import axiosInstance from './axios';
import {
  ApiResponse,
  ArticleDto,
  CreateArticleDto,
  UpdateArticleDto,
  ArticleListDto,
  PieceDetacheeDto,
  CreatePieceDetacheeDto,
  ArticleStatsDto,
} from '../types';

export const articlesApi = {
  getArticles: async (
    page = 1,
    pageSize = 10,
    search?: string,
    categorie?: string
  ): Promise<ApiResponse<ArticleListDto>> => {
    const response = await axiosInstance.get<ApiResponse<ArticleListDto>>('/api/articles', {
      params: { page, pageSize, search, categorie },
    });
    return response.data;
  },

  getArticleById: async (id: number): Promise<ApiResponse<ArticleDto>> => {
    const response = await axiosInstance.get<ApiResponse<ArticleDto>>(`/api/articles/${id}`);
    return response.data;
  },

  createArticle: async (data: CreateArticleDto): Promise<ApiResponse<ArticleDto>> => {
    const response = await axiosInstance.post<ApiResponse<ArticleDto>>('/api/articles', data);
    return response.data;
  },

  updateArticle: async (id: number, data: UpdateArticleDto): Promise<ApiResponse<ArticleDto>> => {
    const response = await axiosInstance.put<ApiResponse<ArticleDto>>(`/api/articles/${id}`, data);
    return response.data;
  },

  deleteArticle: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/api/articles/${id}`);
    return response.data;
  },

  getPiecesDetachees: async (articleId: number): Promise<ApiResponse<PieceDetacheeDto[]>> => {
    const response = await axiosInstance.get<ApiResponse<PieceDetacheeDto[]>>(
      `/api/articles/${articleId}/pieces-detachees`
    );
    return response.data;
  },

  getArticlesStats: async (): Promise<ApiResponse<ArticleStatsDto>> => {
    const response = await axiosInstance.get<ApiResponse<ArticleStatsDto>>('/api/articles/stats');
    return response.data;
  },

  createPieceDetachee: async (
    data: CreatePieceDetacheeDto
  ): Promise<ApiResponse<PieceDetacheeDto>> => {
    const response = await axiosInstance.post<ApiResponse<PieceDetacheeDto>>(
      '/api/pieces-detachees',
      data
    );
    return response.data;
  },

  getPieceDetacheeById: async (id: number): Promise<ApiResponse<PieceDetacheeDto>> => {
    const response = await axiosInstance.get<ApiResponse<PieceDetacheeDto>>(
      `/api/pieces-detachees/${id}`
    );
    return response.data;
  },
};

