import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { articlesApi } from '../../api/articles';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import { toast } from 'react-toastify';

const ArticlesListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categorie, setCategorie] = useState('');
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['articles', page, search, categorie],
    queryFn: () => articlesApi.getArticles(page, pageSize, search || undefined, categorie || undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => articlesApi.deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article supprimé avec succès');
    },
  });

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting article:', error);
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const articles = data?.data?.items || [];
  const totalCount = data?.data?.totalCount || 0;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Articles</h1>
          <p className="mt-2 text-gray-600">Gestion du catalogue d'articles</p>
        </div>
        <button
          onClick={() => navigate('/responsable/articles/new')}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          + Nouvel article
        </button>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="block w-full sm:w-auto border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        />
        <select
          value={categorie}
          onChange={(e) => {
            setCategorie(e.target.value);
            setPage(1);
          }}
          className="block w-full sm:w-auto border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        >
          <option value="">Toutes les catégories</option>
          <option value="Électronique">Électronique</option>
          <option value="Électroménager">Électroménager</option>
          <option value="Informatique">Informatique</option>
        </select>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {articles.map((article) => (
            <li key={article.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <Link to={`/responsable/articles/${article.id}`} className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary-600">{article.nom}</p>
                      <p className="text-sm text-gray-600">Ref: {article.reference}</p>
                      <p className="text-sm text-gray-500">Catégorie: {article.categorie}</p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(article.prixVente)}
                      </p>
                      <p className="text-xs text-gray-500">Garantie: {article.dureeGarantie} mois</p>
                    </div>
                  </div>
                </Link>
                <div className="ml-4 flex space-x-2">
                  <button
                    onClick={() => navigate(`/responsable/articles/${article.id}/edit`)}
                    className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                  >
                    Modifier
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
            </li>
          ))}
        </ul>
        {articles.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500">Aucun article</div>
        )}
      </div>

      {totalCount > pageSize && (
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-700">
            Page {page} sur {Math.ceil(totalCount / pageSize)}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(totalCount / pageSize)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticlesListPage;

