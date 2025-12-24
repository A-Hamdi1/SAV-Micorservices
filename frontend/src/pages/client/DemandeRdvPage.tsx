import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rdvApi, DemandeRdv, CreateDemandeRdvRequest } from '../../api/newFeatures';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';

const DemandeRdvPage = () => {
  const { reclamationId } = useParams<{ reclamationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [myDemandes, setMyDemandes] = useState<DemandeRdv[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  
  // Form state
  const [datePreferee, setDatePreferee] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [creneauPreference, setCreneauPreference] = useState<string>('matin');
  const [commentaire, setCommentaire] = useState('');

  useEffect(() => {
    const fetchMyDemandes = async () => {
      if (!user?.clientId) return;
      
      try {
        setLoading(true);
        const response = await rdvApi.getDemandesByClient(user.clientId);
        setMyDemandes(response.data.data || []);
      } catch (err) {
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyDemandes();
  }, [user?.clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reclamationId || !user?.clientId) {
      setError('Données manquantes');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const data: CreateDemandeRdvRequest = {
        reclamationId: parseInt(reclamationId),
        clientId: user.clientId,
        datePreferee,
        creneauPreference,
        commentaire: commentaire.trim() || undefined
      };
      
      await rdvApi.createDemande(data);
      setSuccess(true);
      
      // Refresh demandes
      const response = await rdvApi.getDemandesByClient(user.clientId);
      setMyDemandes(response.data.data || []);
      
      setTimeout(() => {
        setSuccess(false);
        setActiveTab('history');
      }, 2000);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Erreur lors de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const existingDemandeForReclamation = myDemandes.find(
    d => d.reclamationId === parseInt(reclamationId || '0') && d.statut === 'EnAttente'
  );

  return (
    <div>
      <PageHeader
        title="Demande de Rendez-vous"
        subtitle={`Réclamation #${reclamationId}`}
        breadcrumb={[
          { label: 'Mes réclamations', path: '/client/reclamations' },
          { label: 'Demande de RDV' },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        {/* Tabs */}
        <div className="flex border-b border-stroke mb-6">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'new' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-bodydark2 hover:text-black'
            }`}
          >
            Nouvelle demande
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'history' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-bodydark2 hover:text-black'
            }`}
          >
            Mes demandes ({myDemandes.length})
          </button>
        </div>

        {activeTab === 'new' && (
          <Card>
            <CardBody>
              {success ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-success/10 mb-6">
                    <svg className="h-12 w-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-success mb-2">Demande envoyée !</h2>
                  <p className="text-bodydark2">Vous serez notifié une fois le RDV confirmé.</p>
                </div>
              ) : existingDemandeForReclamation ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-warning/10 mb-6">
                    <svg className="h-12 w-12 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-warning mb-2">Demande en cours</h2>
                  <p className="text-bodydark2 mb-4">
                    Vous avez déjà une demande en attente pour cette réclamation.
                  </p>
                  <p className="text-bodydark2 text-sm">
                    Date demandée: {new Date(existingDemandeForReclamation.dateSouhaitee || existingDemandeForReclamation.datePreferee || '').toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ) : (
                <>
                  {error && <ErrorMessage message={error} />}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Date préférée */}
                    <div>
                      <label className="form-label">
                        Date préférée *
                      </label>
                      <input
                        type="date"
                        value={datePreferee}
                        onChange={(e) => setDatePreferee(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="form-input"
                        required
                      />
                    </div>

                    {/* Créneau préférence */}
                    <div>
                      <label className="form-label">
                        Créneau préféré
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: 'matin', label: '🌅 Matin', desc: '8h - 12h' },
                          { value: 'apres-midi', label: '☀️ Après-midi', desc: '14h - 18h' },
                          { value: 'indifferent', label: '🛈 Indifférent', desc: 'Toute la journée' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setCreneauPreference(option.value)}
                            className={`p-4 rounded-xl border-2 text-center transition-all ${
                              creneauPreference === option.value
                                ? 'border-primary bg-primary/5'
                                : 'border-stroke hover:border-primary/50'
                            }`}
                          >
                            <div className="text-lg mb-1">{option.label}</div>
                            <div className="text-xs text-bodydark2">{option.desc}</div>
                          </button>
                        ))}
                      </div>
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
                        rows={3}
                        placeholder="Précisions sur votre disponibilité, accès au domicile..."
                        maxLength={500}
                      />
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4 pt-4">
                      <Button
                        type="submit"
                        variant="primary"
                        loading={submitting}
                        className="flex-1"
                      >
                        Envoyer la demande
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
                </>
              )}
            </CardBody>
          </Card>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {myDemandes.length === 0 ? (
              <Card>
                <CardBody>
                  <EmptyState
                    title="Aucune demande"
                    description="Vous n'avez pas encore de demande de RDV."
                    icon={
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    }
                  />
                </CardBody>
              </Card>
            ) : (
              myDemandes.map((demande) => (
                <Card key={demande.id}>
                  <CardBody>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-black">
                            Réclamation #{demande.reclamationId}
                          </span>
                          <StatusBadge status={demande.statut} />
                        </div>
                        <div className="text-sm text-bodydark2">
                          <strong>Date demandée:</strong> {new Date(demande.dateSouhaitee || demande.datePreferee || '').toLocaleDateString('fr-FR')}
                        </div>
                        {(demande.preferenceMoment || demande.creneauPreference) && (
                          <div className="text-sm text-bodydark2">
                            <strong>Préférence:</strong> {demande.preferenceMoment || demande.creneauPreference}
                          </div>
                        )}
                        {demande.commentaire && (
                          <div className="text-sm text-bodydark2 mt-2 italic">
                            "{demande.commentaire}"
                          </div>
                        )}
                      </div>
                      <div className="text-right text-xs text-bodydark2">
                        Demandé le<br />
                        {new Date(demande.createdAt || demande.dateCreation || '').toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    
                    {demande.statut === 'Acceptee' && (demande.creneauId || demande.creneauAttribueId) && (
                      <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-xl text-success text-sm flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        RDV confirmé ! Le technicien vous contactera bientôt.
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DemandeRdvPage;
