import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { articlesAchetesApi } from '../../api/articlesAchetes';
import { clientsApi } from '../../api/clients';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { formatDate, formatCurrency } from '../../utils/formatters';

const ArticlesAchetesListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [clientId, setClientId] = useState<number | undefined>(undefined);
  const [sousGarantie, setSousGarantie] = useState<boolean | undefined>(undefined);
  const pageSize = 10;

  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles-achetes', page, clientId, sousGarantie],
    queryFn: () =>
      articlesAchetesApi.getAllArticlesAchates(page, pageSize, clientId, sousGarantie),
  });

  const { data: clients } = useQuery({
    queryKey: ['clients', 'all'],
    queryFn: () => clientsApi.getAllClients(1, 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => articlesAchetesApi.deleteArticleAchat(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles-achetes'] });
      toast.success('Article acheté supprimé avec succès');
    },
  });

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article acheté ?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting article achat:', error);
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const articlesList = articles?.data || [];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Articles achetés</h1>
        <p className="mt-2 text-gray-600">Gestion des articles achetés par les clients</p>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <select
          value={clientId || ''}
          onChange={(e) => {
            setClientId(e.target.value ? parseInt(e.target.value) : undefined);
            setPage(1);
          }}
          className="block w-full sm:w-auto border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        >
          <option value="">Tous les clients</option>
          {clients?.data?.map((client) => (
            <option key={client.id} value={client.id}>
              {client.prenom} {client.nom}
            </option>
          ))}
        </select>
        <select
          value={sousGarantie === undefined ? '' : sousGarantie.toString()}
          onChange={(e) => {
            setSousGarantie(e.target.value === '' ? undefined : e.target.value === 'true');
            setPage(1);
          }}
          className="block w-full sm:w-auto border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        >
          <option value="">Tous</option>
          <option value="true">Sous garantie</option>
          <option value="false">Hors garantie</option>
        </select>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {articlesList.map((article) => (
            <li key={article.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-600">{article.articleNom}</p>
                  <p className="text-sm text-gray-600">Ref: {article.articleReference}</p>
                  <p className="text-sm text-gray-500">N° série: {article.numeroSerie}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Acheté le {formatDate(article.dateAchat)}
                  </p>
                </div>
                <div className="ml-4 flex items-center space-x-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      article.sousGarantie
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {article.sousGarantie ? 'Sous garantie' : 'Hors garantie'}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/responsable/articles-achetes/${article.id}`)}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      Détails
                    </button>
                    <button
                      onClick={(e) => handleDelete(article.id, e)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                      disabled={deleteMutation.isPending}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {articlesList.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500">Aucun article acheté</div>
        )}
      </div>
    </div>
  );
};

export default ArticlesAchetesListPage;

