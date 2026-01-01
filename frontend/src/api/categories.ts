import api from './axios';

export interface Categorie {
  id: number;
  nom: string;
  description?: string;
  createdAt: string;
  articlesCount: number;
}

export interface CreateCategorieDto {
  nom: string;
  description?: string;
}

export interface UpdateCategorieDto {
  nom: string;
  description?: string;
}

export const categoriesApi = {
  getAll: async (): Promise<Categorie[]> => {
    const response = await api.get('/api/categories');
    return response.data.data;
  },

  getById: async (id: number): Promise<Categorie> => {
    const response = await api.get(`/api/categories/${id}`);
    return response.data.data;
  },

  create: async (dto: CreateCategorieDto): Promise<Categorie> => {
    const response = await api.post('/api/categories', dto);
    return response.data.data;
  },

  update: async (id: number, dto: UpdateCategorieDto): Promise<Categorie> => {
    const response = await api.put(`/api/categories/${id}`, dto);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/categories/${id}`);
  },
};
