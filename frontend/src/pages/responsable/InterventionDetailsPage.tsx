import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { interventionsApi } from '../../api/interventions';
import { articlesApi } from '../../api/articles';
import { techniciensApi } from '../../api/techniciens';
import { reclamationsApi } from '../../api/reclamations';
import { articlesAchetesApi } from '../../api/articlesAchetes';
import { pdfApi } from '../../api/newFeatures';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

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
      toast.success('Statut mis Ã  jour');
      setShowChangeStatus(false);
    },
  });

  const addPieceMutation = useMutation({
    mutationFn: (data: AddPieceUtiliseeDto) =>
      interventionsApi.addPieceUtilisee(interventionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intervention', interventionId] });
      toast.success('PiÃ¨ce ajoutÃ©e avec succÃ¨s');
      setShowAddPiece(false);
    },
  });

  const assignTechnicienMutation = useMutation({
    mutationFn: (data: UpdateInterventionTechnicienDto) =>
      interventionsApi.updateInterventionTechnicien(interventionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intervention', interventionId] });
      toast.success('Technicien assignÃ© avec succÃ¨s');
      setShowAssignTechnicien(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => interventionsApi.deleteIntervention(interventionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      toast.success('Intervention supprimÃ©e avec succÃ¨s');
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
    return <LoadingSpinner fullScreen />;
  }

  if (!intervention?.data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-danger px-4 py-3 rounded-lg">
          Intervention non trouvÃ©e
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
    if (window.confirm('ÃŠtes-vous sÃ»r de vouloir supprimer cette intervention ?')) {
      try {
        await deleteMutation.mutateAsync();
      } catch (error) {
        console.error('Error deleting intervention:', error);
      }
    }
  };

  const handleDownloadFacturePdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const response = await pdfApi.downloadFacture(interventionId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facture-intervention-${interventionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Facture PDF tÃ©lÃ©chargÃ©e');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Erreur lors du tÃ©lÃ©chargement de la facture PDF');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadRapportPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const response = await pdfApi.downloadRapportIntervention(interventionId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport-intervention-${interventionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Rapport PDF tÃ©lÃ©chargÃ©');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Erreur lors du tÃ©lÃ©chargement du rapport PDF');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title={`Intervention #${interv.id}`}
        subtitle={<StatusBadge status={interv.statut} />}
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Interventions', path: '/responsable/interventions' },
          { label: `Intervention #${interv.id}` },
        ]}
        actions={
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => navigate(`/responsable/interventions/${interventionId}/edit`)}
            >
              Modifier
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              loading={deleteMutation.isPending}
            >
              Supprimer
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Informations" />
            <CardBody>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-bodydark2">RÃ©clamation ID</dt>
                  <dd className="mt-1 text-sm text-black">{interv.reclamationId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-bodydark2">Technicien</dt>
                  <dd className="mt-1 text-sm text-black">{interv.technicienNom}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-bodydark2">Date d'intervention</dt>
                  <dd className="mt-1 text-sm text-black">{formatDate(interv.dateIntervention)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-bodydark2">Gratuite</dt>
                  <dd className="mt-1 text-sm text-black">
                    {interv.estGratuite ? 'Oui' : 'Non'}
                  </dd>
                </div>
                {interv.montantMainOeuvre && (
                  <div>
                    <dt className="text-sm font-medium text-bodydark2">Main d'Å“uvre</dt>
                    <dd className="mt-1 text-sm text-black">
                      {formatCurrency(interv.montantMainOeuvre)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-bodydark2">Montant total</dt>
                  <dd className="mt-1 text-sm font-bold text-black">
                    {formatCurrency(interv.montantTotal)}
                  </dd>
                </div>
                {interv.commentaire && (
                  <div>
                    <dt className="text-sm font-medium text-bodydark2">Commentaire</dt>
                    <dd className="mt-1 text-sm text-black">{interv.commentaire}</dd>
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="PiÃ¨ces utilisÃ©es"
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddPiece(!showAddPiece)}
                >
                  + Ajouter
                </Button>
              }
            />
            <CardBody>

              {showAddPiece && (
                <div className="mb-4 p-4 bg-gray-2 rounded-lg">
                  <form onSubmit={handleSubmitPiece(onSubmitPiece)} className="space-y-3">
                    <div>
                      <label className="form-label">
                        PiÃ¨ce dÃ©tachÃ©e
                      </label>
                      <select
                        {...registerPiece('pieceDetacheeId', {
                          required: 'PiÃ¨ce requise',
                          valueAsNumber: true,
                        })}
                        className="form-select"
                      >
                        <option value="">SÃ©lectionner une piÃ¨ce</option>
                        {piecesDetachees?.data?.map((piece) => (
                          <option key={piece.id} value={piece.id}>
                            {piece.nom} - {piece.reference} ({formatCurrency(piece.prix)}) - Stock: {piece.stock}
                          </option>
                        ))}
                      </select>
                      {(!piecesDetachees?.data || piecesDetachees.data.length === 0) && (
                        <p className="mt-1 text-sm text-warning">
                          Aucune piÃ¨ce dÃ©tachÃ©e disponible pour cet article
                        </p>
                      )}
                      {errorsPiece.pieceDetacheeId && (
                        <p className="mt-1 text-sm text-danger">
                          {errorsPiece.pieceDetacheeId.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="form-label">QuantitÃ©</label>
                      <input
                        {...registerPiece('quantite', {
                          required: 'QuantitÃ© requise',
                          min: { value: 1, message: 'La quantitÃ© doit Ãªtre au moins 1' },
                          valueAsNumber: true,
                        })}
                        type="number"
                        className="form-input"
                      />
                      {errorsPiece.quantite && (
                        <p className="mt-1 text-sm text-danger">{errorsPiece.quantite.message}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={addPieceMutation.isPending}
                        loading={addPieceMutation.isPending}
                      >
                        Ajouter
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowAddPiece(false);
                          resetPiece();
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {interv.piecesUtilisees && interv.piecesUtilisees.length > 0 ? (
                <div className="space-y-4">
                  {interv.piecesUtilisees.map((piece) => (
                    <div key={piece.id} className="border border-stroke rounded-lg p-4">
                      <p className="text-sm font-medium text-black">{piece.pieceNom}</p>
                      <p className="text-sm text-bodydark2">Ref: {piece.pieceReference}</p>
                      <div className="mt-2 flex justify-between">
                        <p className="text-sm text-bodydark2">QuantitÃ©: {piece.quantite}</p>
                        <p className="text-sm font-medium text-black">
                          {formatCurrency(piece.sousTotal)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-bodydark2 text-sm">Aucune piÃ¨ce utilisÃ©e</p>
              )}
            </CardBody>
          </Card>

          {interv.statut === 'Terminee' && facture?.data && (
            <Card>
              <CardHeader
                title="Facture"
                action={
                  <div className="flex gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={handleDownloadFacturePdf}
                      disabled={isDownloadingPdf}
                      loading={isDownloadingPdf}
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      }
                    >
                      Facture PDF
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleDownloadRapportPdf}
                      disabled={isDownloadingPdf}
                      loading={isDownloadingPdf}
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      }
                    >
                      Rapport PDF
                    </Button>
                  </div>
                }
              />
              <CardBody>
                <pre className="whitespace-pre-wrap text-sm text-bodydark2 bg-gray-2 p-4 rounded-lg">
                  {facture.data}
                </pre>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Actions" />
            <CardBody>
              <div className="space-y-3">
                <Button
                  variant="warning"
                  fullWidth
                  onClick={() => setShowChangeStatus(!showChangeStatus)}
                >
                  Changer le statut
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => setShowAssignTechnicien(!showAssignTechnicien)}
                >
                  {interv.technicienNom ? 'Changer de technicien' : 'Assigner technicien'}
                </Button>
              </div>
            </CardBody>
          </Card>

          {showChangeStatus && (
            <Card>
              <CardHeader title="Changer le statut" />
              <CardBody>
                <form onSubmit={handleSubmitStatus(onSubmitStatus)} className="space-y-4">
                  <div>
                    <label className="form-label">Statut</label>
                    <select
                      {...registerStatus('statut', { required: 'Statut requis' })}
                      className="form-select"
                    >
                      <option value="Planifiee">PlanifiÃ©e</option>
                      <option value="EnCours">En Cours</option>
                      <option value="Terminee">TerminÃ©e</option>
                      <option value="Annulee">AnnulÃ©e</option>
                    </select>
                    {errorsStatus.statut && (
                      <p className="mt-1 text-sm text-danger">{errorsStatus.statut.message}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={updateStatusMutation.isPending}
                      loading={updateStatusMutation.isPending}
                      fullWidth
                    >
                      Mettre Ã  jour
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowChangeStatus(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          )}

          {showAssignTechnicien && (
            <Card>
              <CardHeader title="Assigner technicien" />
              <CardBody>
                <form onSubmit={handleSubmitTechnicien(onSubmitTechnicien)} className="space-y-4">
                  <div>
                    <label className="form-label">Technicien</label>
                    <select
                      {...registerTechnicien('technicienId', {
                        required: 'Technicien requis',
                        valueAsNumber: true,
                      })}
                      className="form-select"
                    >
                      <option value="">SÃ©lectionner un technicien</option>
                      {techniciens?.data?.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.nomComplet} - {tech.specialite}
                        </option>
                      ))}
                    </select>
                    {errorsTechnicien.technicienId && (
                      <p className="mt-1 text-sm text-danger">
                        {errorsTechnicien.technicienId.message}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={assignTechnicienMutation.isPending}
                      loading={assignTechnicienMutation.isPending}
                      fullWidth
                    >
                      Assigner
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAssignTechnicien(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterventionDetailsPage;
