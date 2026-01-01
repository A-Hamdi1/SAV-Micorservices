import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { categoriesApi, Categorie } from '../../api/categories';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/formatters';

const CategoriesListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Catégorie supprimée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de la catégorie');
    },
  });

  const handleDelete = async (id: number, articlesCount: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (articlesCount > 0) {
      toast.warning(`Cette catégorie contient ${articlesCount} article(s). Les articles seront détachés de cette catégorie.`);
    }
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  // Filter categories based on search
  const filteredCategories = categories.filter((cat: Categorie) =>
    cat.nom.toLowerCase().includes(search.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catégories"
        subtitle="Gestion des catégories d'articles"
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Catégories' },
        ]}
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/responsable/categories/new')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle catégorie
          </Button>
        }
      />

      {/* Search */}
      <Card>
        <CardBody className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher une catégorie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-10 w-full max-w-md"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </CardBody>
      </Card>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <EmptyState
          title="Aucune catégorie"
          description="Commencez par créer une nouvelle catégorie d'articles."
          action={
            <Button
              variant="primary"
              onClick={() => navigate('/responsable/categories/new')}
            >
              Créer une catégorie
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category: Categorie) => (
            <div 
              key={category.id}
              onClick={() => navigate(`/responsable/categories/${category.id}/edit`)}
              className="cursor-pointer"
            >
              <Card className="hover:shadow-lg transition-shadow h-full">
              <CardBody className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                        {category.nom}
                      </h3>
                      <span className="text-sm text-slate-500">
                        {category.articlesCount} article{category.articlesCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(category.id, category.articlesCount, e)}
                    className="p-2 text-danger hover:bg-danger/10 rounded-xl transition-colors"
                    title="Supprimer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                {category.description && (
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                    {category.description}
                  </p>
                )}
                
                <div className="text-xs text-slate-400">
                  Créée le {formatDate(category.createdAt)}
                </div>
              </CardBody>
            </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesListPage;
