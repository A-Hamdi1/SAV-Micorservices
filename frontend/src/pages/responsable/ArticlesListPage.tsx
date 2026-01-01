import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { articlesApi } from '../../api/articles';
import { categoriesApi } from '../../api/categories';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
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

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
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
    return <LoadingSpinner fullScreen />;
  }

  const articles = data?.data?.items || [];
  const totalCount = data?.data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Articles"
        subtitle="Gestion du catalogue d'articles"
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Articles' },
        ]}
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/responsable/articles/new')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvel article
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="form-input pl-10 min-w-[200px]"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bodydark2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select
                value={categorie}
                onChange={(e) => {
                  setCategorie(e.target.value);
                  setPage(1);
                }}
                className="form-select min-w-[180px]"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.nom}>{cat.nom}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm text-bodydark2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>{totalCount} article(s)</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Articles List */}
      <Card>
        <CardBody className="p-0">
          {articles.length === 0 ? (
            <EmptyState
              title="Aucun article"
              description="Commencez par ajouter votre premier article au catalogue."
              icon={
                <svg className="w-12 h-12 text-bodydark2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
              action={
                <Button variant="primary" onClick={() => navigate('/responsable/articles/new')}>
                  Ajouter un article
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-stroke">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between p-5 hover:bg-gray-2 transition-colors"
                >
                  <Link
                    to={`/responsable/articles/${article.id}`}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-black mb-1">
                        {article.nom}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-bodydark2 mb-1">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {article.reference}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {article.categorie}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-bodydark2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>Garantie: {article.dureeGarantie} mois</span>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-black">
                        {formatCurrency(article.prixVente)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/responsable/articles/${article.id}/edit`)}
                        className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                        title="Modifier"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDelete(article.id, e)}
                        className="p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                        disabled={deleteMutation.isPending}
                        title="Supprimer"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <Link
                        to={`/responsable/articles/${article.id}`}
                        className="p-2 rounded-lg text-bodydark2 hover:bg-gray-2 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export default ArticlesListPage;

