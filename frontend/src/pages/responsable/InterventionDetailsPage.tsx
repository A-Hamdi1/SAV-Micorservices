import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { interventionsApi } from '../../api/interventions';
import { articlesApi } from '../../api/articles';
import { techniciensApi } from '../../api/techniciens';
import { reclamationsApi } from '../../api/reclamations';
import { articlesAchetesApi } from '../../api/articlesAchetes';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate, formatCurrency } from '../../utils/formatters';
import {
  UpdateInterventionStatutDto,
  AddPieceUtiliseeDto,
  UpdateInterventionTechnicienDto,
} from '../../types';
import { toast } from 'react-toastify';

const InterventionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const interventionId = parseInt(id || '0');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddPiece, setShowAddPiece] = useState(false);
  const [showChangeStatus, setShowChangeStatus] = useState(false);
  const [showAssignTechnicien, setShowAssignTechnicien] = useState(false);

  const { data: intervention, isLoading } = useQuery({
    queryKey: ['intervention', interventionId],
    queryFn: () => interventionsApi.getInterventionById(interventionId),
    enabled: !!interventionId,
  });

  // Get the reclamation to find the article
  const { data: reclamation } = useQuery({
    queryKey: ['reclamation', intervention?.data?.reclamationId],
    queryFn: () => reclamationsApi.getReclamationById(intervention!.data!.reclamationId),
    enabled: !!intervention?.data?.reclamationId,
  });

  // Get the article achat to find the article ID
  const { data: articleAchat } = useQuery({
    queryKey: ['article-achat', reclamation?.data?.articleAchatId],
    queryFn: () => articlesAchetesApi.getArticleAchatById(reclamation!.data!.articleAchatId),
    enabled: !!reclamation?.data?.articleAchatId,
  });

  const { data: facture } = useQuery({
    queryKey: ['facture', interventionId],
    queryFn: () => interventionsApi.genererFacture(interventionId),
    enabled: !!interventionId && intervention?.data?.statut === 'Terminee',
  });

  // Fetch pieces from the specific article
  const { data: piecesDetachees } = useQuery({
    queryKey: ['pieces-detachees', articleAchat?.data?.articleId],
    queryFn: () => articlesApi.getPiecesDetachees(articleAchat!.data!.articleId),
    enabled: showAddPiece && !!articleAchat?.data?.articleId,
  });

  const { data: techniciens } = useQuery({
    queryKey: ['techniciens'],
    queryFn: () => techniciensApi.getAllTechniciens(),
    enabled: showAssignTechnicien,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: UpdateInterventionStatutDto) =>
      interventionsApi.updateInterventionStatut(interventionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intervention', interventionId] });
      toast.success('Statut mis à jour');
      setShowChangeStatus(false);
    },
  });

  const addPieceMutation = useMutation({
    mutationFn: (data: AddPieceUtiliseeDto) =>
      interventionsApi.addPieceUtilisee(interventionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intervention', interventionId] });
      toast.success('Pièce ajoutée avec succès');
      setShowAddPiece(false);
    },
  });

  const assignTechnicienMutation = useMutation({
    mutationFn: (data: UpdateInterventionTechnicienDto) =>
      interventionsApi.updateInterventionTechnicien(interventionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intervention', interventionId] });
      toast.success('Technicien assigné avec succès');
      setShowAssignTechnicien(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => interventionsApi.deleteIntervention(interventionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      toast.success('Intervention supprimée avec succès');
      navigate('/responsable/interventions');
    },
  });

  const {
    register: registerStatus,
    handleSubmit: handleSubmitStatus,
    formState: { errors: errorsStatus },
  } = useForm<UpdateInterventionStatutDto>();

  const {
    register: registerPiece,
    handleSubmit: handleSubmitPiece,
    formState: { errors: errorsPiece },
    reset: resetPiece,
  } = useForm<AddPieceUtiliseeDto>();

  const {
    register: registerTechnicien,
    handleSubmit: handleSubmitTechnicien,
    formState: { errors: errorsTechnicien },
  } = useForm<UpdateInterventionTechnicienDto>();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!intervention?.data) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Intervention non trouvée
        </div>
      </div>
    );
  }

  const interv = intervention.data;

  const onSubmitStatus = async (data: UpdateInterventionStatutDto) => {
    try {
      await updateStatusMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const onSubmitPiece = async (data: AddPieceUtiliseeDto) => {
    try {
      await addPieceMutation.mutateAsync(data);
      resetPiece();
    } catch (error) {
      console.error('Error adding piece:', error);
    }
  };

  const onSubmitTechnicien = async (data: UpdateInterventionTechnicienDto) => {
    try {
      await assignTechnicienMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error assigning technicien:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
      try {
        await deleteMutation.mutateAsync();
      } catch (error) {
        console.error('Error deleting intervention:', error);
      }
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link
          to="/responsable/interventions"
          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
        >
          ← Retour aux interventions
        </Link>
      </div>

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Intervention #{interv.id}</h1>
          <div className="mt-2 flex items-center">
            <StatusBadge status={interv.statut} />
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/responsable/interventions/${interventionId}/edit`)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Modifier
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Informations</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Réclamation ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{interv.reclamationId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Technicien</dt>
                  <dd className="mt-1 text-sm text-gray-900">{interv.technicienNom}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date d'intervention</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(interv.dateIntervention)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Gratuite</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {interv.estGratuite ? 'Oui' : 'Non'}
                  </dd>
                </div>
                {interv.montantMainOeuvre && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Main d'œuvre</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatCurrency(interv.montantMainOeuvre)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Montant total</dt>
                  <dd className="mt-1 text-sm font-bold text-gray-900">
                    {formatCurrency(interv.montantTotal)}
                  </dd>
                </div>
                {interv.commentaire && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Commentaire</dt>
                    <dd className="mt-1 text-sm text-gray-900">{interv.commentaire}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Pièces utilisées</h2>
                <button
                  onClick={() => setShowAddPiece(!showAddPiece)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-xs font-medium"
                >
                  + Ajouter
                </button>
              </div>

              {showAddPiece && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <form onSubmit={handleSubmitPiece(onSubmitPiece)} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Pièce détachée
                      </label>
                      <select
                        {...registerPiece('pieceDetacheeId', {
                          required: 'Pièce requise',
                          valueAsNumber: true,
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value="">Sélectionner une pièce</option>
                        {piecesDetachees?.data?.map((piece) => (
                          <option key={piece.id} value={piece.id}>
                            {piece.nom} - {piece.reference} ({formatCurrency(piece.prix)}) - Stock: {piece.stock}
                          </option>
                        ))}
                      </select>
                      {(!piecesDetachees?.data || piecesDetachees.data.length === 0) && (
                        <p className="mt-1 text-sm text-yellow-600">
                          Aucune pièce détachée disponible pour cet article
                        </p>
                      )}
                      {errorsPiece.pieceDetacheeId && (
                        <p className="mt-1 text-sm text-red-600">
                          {errorsPiece.pieceDetacheeId.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantité</label>
                      <input
                        {...registerPiece('quantite', {
                          required: 'Quantité requise',
                          min: { value: 1, message: 'La quantité doit être au moins 1' },
                          valueAsNumber: true,
                        })}
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                      {errorsPiece.quantite && (
                        <p className="mt-1 text-sm text-red-600">{errorsPiece.quantite.message}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        disabled={addPieceMutation.isPending}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-xs font-medium disabled:opacity-50"
                      >
                        {addPieceMutation.isPending ? 'Ajout...' : 'Ajouter'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddPiece(false);
                          resetPiece();
                        }}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-xs font-medium"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {interv.piecesUtilisees && interv.piecesUtilisees.length > 0 ? (
                <div className="space-y-4">
                  {interv.piecesUtilisees.map((piece) => (
                    <div key={piece.id} className="border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-900">{piece.pieceNom}</p>
                      <p className="text-sm text-gray-600">Ref: {piece.pieceReference}</p>
                      <div className="mt-2 flex justify-between">
                        <p className="text-sm text-gray-600">Quantité: {piece.quantite}</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(piece.sousTotal)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Aucune pièce utilisée</p>
              )}
            </div>
          </div>

          {interv.statut === 'Terminee' && facture?.data && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Facture</h2>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded">
                  {facture.data}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Actions</h2>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => setShowChangeStatus(!showChangeStatus)}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Changer le statut
                </button>
                <button
                  onClick={() => setShowAssignTechnicien(!showAssignTechnicien)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {interv.technicienNom ? 'Changer de technicien' : 'Assigner technicien'}
                </button>
              </div>
            </div>
          </div>

          {showChangeStatus && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Changer le statut</h2>
                <form onSubmit={handleSubmitStatus(onSubmitStatus)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                    <select
                      {...registerStatus('statut', { required: 'Statut requis' })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="Planifiee">Planifiée</option>
                      <option value="EnCours">En Cours</option>
                      <option value="Terminee">Terminée</option>
                      <option value="Annulee">Annulée</option>
                    </select>
                    {errorsStatus.statut && (
                      <p className="mt-1 text-sm text-red-600">{errorsStatus.statut.message}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                    >
                      {updateStatusMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowChangeStatus(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showAssignTechnicien && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Assigner technicien</h2>
                <form onSubmit={handleSubmitTechnicien(onSubmitTechnicien)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Technicien</label>
                    <select
                      {...registerTechnicien('technicienId', {
                        required: 'Technicien requis',
                        valueAsNumber: true,
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="">Sélectionner un technicien</option>
                      {techniciens?.data?.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.nomComplet} - {tech.specialite}
                        </option>
                      ))}
                    </select>
                    {errorsTechnicien.technicienId && (
                      <p className="mt-1 text-sm text-red-600">
                        {errorsTechnicien.technicienId.message}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={assignTechnicienMutation.isPending}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                    >
                      {assignTechnicienMutation.isPending ? 'Assignation...' : 'Assigner'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAssignTechnicien(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterventionDetailsPage;
