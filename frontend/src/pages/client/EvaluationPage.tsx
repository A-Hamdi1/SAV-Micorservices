import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { evaluationsApi, Evaluation, CreateEvaluationRequest } from '../../api/newFeatures';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';

const EvaluationPage = () => {
  const { interventionId } = useParams<{ interventionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [existingEvaluation, setExistingEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState('');
  const [recommande, setRecommande] = useState(true);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    const checkExistingEvaluation = async () => {
      if (!interventionId) return;
      
      try {
        setLoading(true);
        const response = await evaluationsApi.getByIntervention(parseInt(interventionId));
        if (response.data.data) {
          setExistingEvaluation(response.data.data);
        }
      } catch (err) {
        // 404 = pas d'Ã©valuation existante, c'est OK
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr.response?.status !== 404) {
          console.error('Erreur:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    checkExistingEvaluation();
  }, [interventionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!interventionId || !user?.clientId) {
      setError('DonnÃ©es manquantes');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const data: CreateEvaluationRequest = {
        interventionId: parseInt(interventionId),
        clientId: user.clientId,
        note,
        commentaire: commentaire.trim() || undefined,
        recommandeTechnicien: recommande
      };
      
      await evaluationsApi.create(data);
      setSuccess(true);
      
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Erreur lors de l\'envoi de l\'Ã©valuation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (existingEvaluation) {
    return (
      <div>
        <PageHeader
          title="Ã‰valuation"
          breadcrumb={[
            { label: 'Mes rÃ©clamations', path: '/client/reclamations' },
            { label: 'Ã‰valuation' },
          ]}
        />
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardBody className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-success/10 mb-6">
                <svg className="h-12 w-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-black mb-4">Ã‰valuation dÃ©jÃ  soumise</h1>
              <p className="text-bodydark2 mb-6">
                Vous avez dÃ©jÃ  Ã©valuÃ© cette intervention le {new Date(existingEvaluation.createdAt).toLocaleDateString('fr-FR')}.
              </p>
              
              <div className="bg-gray-2 dark:bg-meta-4 rounded-xl p-6 text-left">
                <div className="mb-4">
                  <div className="text-sm text-bodydark2 mb-1">Votre note</div>
                  <div className="text-3xl text-warning">
                    {'â˜…'.repeat(existingEvaluation.note)}{'â˜†'.repeat(5 - existingEvaluation.note)}
                  </div>
                </div>
                
                {existingEvaluation.commentaire && (
                  <div className="mb-4">
                    <div className="text-sm text-bodydark2 mb-1">Votre commentaire</div>
                    <p className="text-black">{existingEvaluation.commentaire}</p>
                  </div>
                )}
                
                <div>
                  <div className="text-sm text-bodydark2 mb-1">Recommandation</div>
                  <p className={existingEvaluation.recommandeTechnicien ? 'text-success' : 'text-danger'}>
                    {existingEvaluation.recommandeTechnicien ? 'ðŸ‘ Recommande le technicien' : 'ðŸ‘Ž Ne recommande pas'}
                  </p>
                </div>
              </div>
              
              <Button
                onClick={() => navigate(-1)}
                variant="primary"
                className="mt-6"
              >
                Retour
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div>
        <PageHeader
          title="Ã‰valuation"
          breadcrumb={[
            { label: 'Mes rÃ©clamations', path: '/client/reclamations' },
            { label: 'Ã‰valuation' },
          ]}
        />
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardBody className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-success/10 mb-6">
                <svg className="h-12 w-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-success mb-4">Merci pour votre Ã©valuation !</h1>
              <p className="text-bodydark2">Votre retour nous aide Ã  amÃ©liorer notre service.</p>
              <p className="text-bodydark2 text-sm mt-4">Redirection en cours...</p>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Ã‰valuer l'intervention"
        subtitle={`Intervention #${interventionId}`}
        breadcrumb={[
          { label: 'Mes rÃ©clamations', path: '/client/reclamations' },
          { label: 'Ã‰valuation' },
        ]}
      />

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardBody>
            {error && <ErrorMessage message={error} />}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Note Stars */}
              <div>
                <label className="form-label text-center block">
                  Comment Ã©valuez-vous cette intervention ?
                </label>
                <div className="flex justify-center gap-2 mt-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNote(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="text-5xl focus:outline-none transition-transform hover:scale-110"
                    >
                      {star <= (hoveredStar || note) ? (
                        <span className="text-warning">â˜…</span>
                      ) : (
                        <span className="text-bodydark2/30">â˜†</span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-center text-bodydark2 mt-2">
                  {note === 1 && 'ðŸ˜ž TrÃ¨s insatisfait'}
                  {note === 2 && 'ðŸ˜• Insatisfait'}
                  {note === 3 && 'ðŸ˜ Neutre'}
                  {note === 4 && 'ðŸ™‚ Satisfait'}
                  {note === 5 && 'ðŸ˜Š TrÃ¨s satisfait'}
                </p>
              </div>

              {/* Commentaire */}
              <div>
                <label className="form-label">
                  Commentaire (optionnel)
                </label>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  className="form-input"
                  rows={4}
                  placeholder="Partagez votre expÃ©rience..."
                  maxLength={1000}
                />
                <p className="text-xs text-bodydark2 mt-1 text-right">
                  {commentaire.length}/1000 caractÃ¨res
                </p>
              </div>

              {/* Recommandation */}
              <div>
                <label className="form-label">
                  Recommanderiez-vous ce technicien ?
                </label>
                <div className="flex gap-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setRecommande(true)}
                    className={`flex-1 py-4 rounded-xl border-2 transition-all ${
                      recommande
                        ? 'border-success bg-success/10 text-success'
                        : 'border-stroke hover:border-success/50'
                    }`}
                  >
                    <span className="text-2xl block mb-1">ðŸ‘</span>
                    Oui, je recommande
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecommande(false)}
                    className={`flex-1 py-4 rounded-xl border-2 transition-all ${
                      !recommande
                        ? 'border-danger bg-danger/10 text-danger'
                        : 'border-stroke hover:border-danger/50'
                    }`}
                  >
                    <span className="text-2xl block mb-1">ðŸ‘Ž</span>
                    Non
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  className="flex-1"
                >
                  Envoyer mon Ã©valuation
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default EvaluationPage;
