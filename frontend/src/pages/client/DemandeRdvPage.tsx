import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { rdvApi, DemandeRdv, CreateDemandeRdvRequest, CreneauDisponible } from '../../api/newFeatures';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';

// Liste des motifs prédéfinis
const MOTIFS_PREDEFINIS = [
  { value: 'installation_radiateur', label: 'Installation radiateur', icon: '🌡️' },
  { value: 'reparation_chaudiere', label: 'Réparation chaudière', icon: '🔥' },
  { value: 'entretien_chauffage', label: 'Entretien chauffage central', icon: '🔧' },
  { value: 'fuite_tuyauterie', label: 'Fuite tuyauterie', icon: '💧' },
  { value: 'sanitaires_eau', label: 'Problèmes sanitaires/eau', icon: '🚿' },
  { value: 'reparation_robinetterie', label: 'Réparation robinetterie', icon: '🚰' },
  { value: 'diagnostic', label: 'Diagnostic général', icon: '🔍' },
  { value: 'autre', label: 'Autre (préciser)', icon: '📝' },
];

const DemandeRdvPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [myDemandes, setMyDemandes] = useState<DemandeRdv[]>([]);
  const [creneaux, setCreneaux] = useState<CreneauDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCreneaux, setLoadingCreneaux] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  
  // Form state
  const [motifType, setMotifType] = useState<string>('');
  const [motifAutre, setMotifAutre] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedCreneauId, setSelectedCreneauId] = useState<number | null>(null);
  const [commentaire, setCommentaire] = useState('');

  // Vérifier si le client a un RDV actif
  const rdvActif = useMemo(() => {
    return myDemandes.find(d => {
      const isActiveStatus = d.statut === 'EnAttente' || d.statut === 'Confirmee';
      if (!isActiveStatus) return false;
      
      // Si confirmé avec un créneau, vérifier que la date n'est pas passée
      if (d.statut === 'Confirmee' && d.creneau) {
        return new Date(d.creneau.dateFin) > new Date();
      }
      
      // Si en attente, toujours considéré comme actif
      return d.statut === 'EnAttente';
    });
  }, [myDemandes]);

  // Calculer les créneaux disponibles pour la date sélectionnée
  const creneauxPourDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStart = new Date(selectedDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(selectedDate);
    dateEnd.setHours(23, 59, 59, 999);
    
    return creneaux.filter(c => {
      const creneauDate = new Date(c.dateDebut);
      return creneauDate >= dateStart && creneauDate <= dateEnd && !c.estReserve;
    }).sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());
  }, [creneaux, selectedDate]);

  // Charger les demandes du client
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

  // Charger les créneaux disponibles
  useEffect(() => {
    const fetchCreneaux = async () => {
      try {
        setLoadingCreneaux(true);
        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        const response = await rdvApi.getCreneauxDisponibles(today, nextMonth.toISOString().split('T')[0]);
        setCreneaux(response.data.data || []);
      } catch (err) {
        console.error('Erreur chargement créneaux:', err);
      } finally {
        setLoadingCreneaux(false);
      }
    };

    fetchCreneaux();
  }, []);

  // Obtenir le motif final
  const getMotifFinal = () => {
    if (motifType === 'autre') {
      return motifAutre.trim();
    }
    const motif = MOTIFS_PREDEFINIS.find(m => m.value === motifType);
    return motif?.label || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.clientId) {
      setError('Vous devez être connecté');
      return;
    }

    const motifFinal = getMotifFinal();
    if (!motifFinal) {
      setError('Veuillez sélectionner ou saisir un motif');
      return;
    }

    if (!selectedCreneauId) {
      setError('Veuillez sélectionner un créneau pour votre rendez-vous');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const data: CreateDemandeRdvRequest = {
        clientId: user.clientId,
        motif: motifFinal,
        creneauId: selectedCreneauId || undefined,
        dateSouhaitee: selectedDate,
        commentaire: commentaire.trim() || undefined
      };
      
      await rdvApi.createDemande(data);
      setSuccess(true);
      
      // Refresh demandes
      const response = await rdvApi.getDemandesByClient(user.clientId);
      setMyDemandes(response.data.data || []);
      
      // Refresh créneaux
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const creneauxResponse = await rdvApi.getCreneauxDisponibles(today, nextMonth.toISOString().split('T')[0]);
      setCreneaux(creneauxResponse.data.data || []);
      
      // Reset form
      setMotifType('');
      setMotifAutre('');
      setSelectedCreneauId(null);
      setCommentaire('');
      
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

  const handleCancelDemande = async (demandeId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) return;
    
    try {
      await rdvApi.annulerDemande(demandeId);
      // Refresh
      if (user?.clientId) {
        const response = await rdvApi.getDemandesByClient(user.clientId);
        setMyDemandes(response.data.data || []);
      }
    } catch (err) {
      console.error('Erreur annulation:', err);
    }
  };

  // Formatter l'heure
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div>
      <PageHeader
        title="Demande de Rendez-vous"
        subtitle="Planifiez un rendez-vous pour maintenance ou service"
        breadcrumb={[
          { label: 'Dashboard', path: '/client/dashboard' },
          { label: 'Demande de RDV' },
        ]}
      />

      <div className="max-w-4xl mx-auto">
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
            ➕ Nouvelle demande
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'history' 
                ? 'border-b-2 border-primary text-primary' 
                : 'text-bodydark2 hover:text-black'
            }`}
          >
            📋 Mes demandes ({myDemandes.length})
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
                  <p className="text-bodydark2">Vous serez notifié une fois le RDV confirmé par le responsable.</p>
                </div>
              ) : rdvActif ? (
                // Client a déjà un RDV actif
                <div className="text-center py-8">
                  <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-warning/10 mb-6">
                    <svg className="h-12 w-12 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-warning mb-2">
                    {rdvActif.statut === 'EnAttente' ? 'Demande en cours' : 'RDV confirmé'}
                  </h2>
                  <p className="text-bodydark2 mb-4">
                    {rdvActif.statut === 'EnAttente' 
                      ? 'Vous avez déjà une demande de RDV en attente de confirmation.'
                      : 'Vous avez déjà un RDV confirmé. Vous pourrez en créer un nouveau une fois celui-ci passé.'}
                  </p>
                  
                  <div className="bg-bodydark1/10 rounded-xl p-4 text-left max-w-md mx-auto">
                    <div className="font-semibold text-black mb-2">{rdvActif.motif}</div>
                    <div className="text-sm text-bodydark2 space-y-1">
                      {rdvActif.statut === 'EnAttente' ? (
                        <p>📅 Date souhaitée: {new Date(rdvActif.dateSouhaitee || rdvActif.datePreferee || '').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                      ) : rdvActif.creneau && (
                        <>
                          <p className="text-success font-medium">✅ RDV confirmé</p>
                          <p>📅 {new Date(rdvActif.creneau.dateDebut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                          <p>🕐 {formatTime(rdvActif.creneau.dateDebut)} - {formatTime(rdvActif.creneau.dateFin)}</p>
                          <p>👨‍🔧 Technicien: {rdvActif.creneau.technicienNom}</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => setActiveTab('history')}
                  >
                    Voir mon historique
                  </Button>
                </div>
              ) : (
                <>
                  {error && <ErrorMessage message={error} />}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Motif */}
                    <div>
                      <label className="form-label">
                        Motif du rendez-vous *
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {MOTIFS_PREDEFINIS.map((motif) => (
                          <button
                            key={motif.value}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setMotifType(motif.value);
                            }}
                            className={`relative p-4 rounded-xl border-2 text-left transition-all cursor-pointer select-none ${
                              motifType === motif.value
                                ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-md'
                                : 'border-stroke hover:border-primary/50 hover:bg-gray-50'
                            }`}
                          >
                            {motifType === motif.value && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                            <div className="text-2xl mb-2">{motif.icon}</div>
                            <div className={`text-sm font-medium ${motifType === motif.value ? 'text-primary' : ''}`}>{motif.label}</div>
                          </button>
                        ))}
                      </div>
                      
                      {motifType === 'autre' && (
                        <input
                          type="text"
                          value={motifAutre}
                          onChange={(e) => setMotifAutre(e.target.value)}
                          className="form-input mt-3"
                          placeholder="Précisez votre besoin..."
                          maxLength={200}
                          required
                        />
                      )}
                    </div>

                    {/* Date souhaitée */}
                    <div>
                      <label className="form-label">
                        Date souhaitée *
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedCreneauId(null); // Reset créneau quand la date change
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className="form-input"
                        required
                      />
                    </div>

                    {/* Créneaux disponibles */}
                    <div>
                      <label className="form-label flex items-center justify-between">
                        <span>Créneau *</span>
                        {loadingCreneaux && <LoadingSpinner size="sm" />}
                      </label>
                      
                      {!loadingCreneaux && creneauxPourDate.length === 0 ? (
                        <div className="p-6 bg-warning/10 border border-warning/20 rounded-xl text-center">
                          <svg className="w-12 h-12 mx-auto mb-3 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-warning font-medium mb-1">Aucun créneau disponible</p>
                          <p className="text-sm text-bodydark2">
                            Aucun créneau n'est disponible pour cette date. Veuillez choisir une autre date.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {creneauxPourDate.map((creneau) => (
                            <button
                              key={creneau.id}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedCreneauId(creneau.id);
                              }}
                              className={`relative p-4 rounded-xl border-2 text-center transition-all cursor-pointer select-none ${
                                selectedCreneauId === creneau.id
                                  ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-md'
                                  : 'border-stroke hover:border-primary/50 hover:bg-gray-50'
                              }`}
                            >
                              {selectedCreneauId === creneau.id && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              <div className={`text-lg font-bold ${selectedCreneauId === creneau.id ? 'text-primary' : 'text-primary'}`}>
                                {formatTime(creneau.dateDebut)}
                              </div>
                              <div className="text-xs text-bodydark2">
                                à {formatTime(creneau.dateFin)}
                              </div>
                              <div className={`text-xs mt-1 ${selectedCreneauId === creneau.id ? 'text-primary font-medium' : 'text-bodydark'}`}>
                                {creneau.technicienNom}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {creneauxPourDate.length > 0 && !selectedCreneauId && (
                        <p className="text-xs text-warning mt-2">
                          ⚠️ Veuillez sélectionner un créneau pour continuer.
                        </p>
                      )}
                    </div>

                    {/* Commentaire */}
                    <div>
                      <label className="form-label">
                        Informations complémentaires (optionnel)
                      </label>
                      <textarea
                        value={commentaire}
                        onChange={(e) => setCommentaire(e.target.value)}
                        className="form-input"
                        rows={3}
                        placeholder="Marque/modèle de l'appareil, problèmes spécifiques, contraintes horaires..."
                        maxLength={500}
                      />
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4 pt-4">
                      <Button
                        type="submit"
                        variant="primary"
                        loading={submitting}
                        disabled={!motifType || (motifType === 'autre' && !motifAutre.trim()) || !selectedCreneauId}
                        className="flex-1"
                      >
                        📅 Envoyer la demande
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
                    action={
                      <Button variant="primary" onClick={() => setActiveTab('new')}>
                        Créer une demande
                      </Button>
                    }
                  />
                </CardBody>
              </Card>
            ) : (
              myDemandes.map((demande) => (
                <Card key={demande.id}>
                  <CardBody>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-black text-lg">
                            {demande.motif || 'Service SAV'}
                          </span>
                          <StatusBadge status={demande.statut} />
                        </div>
                        
                        {demande.reclamationId && (
                          <div className="text-sm text-bodydark2 mb-1">
                            🔗 Lié à la réclamation #{demande.reclamationId}
                          </div>
                        )}
                        
                        <div className="text-sm text-bodydark2">
                          📅 <strong>Date souhaitée:</strong> {new Date(demande.dateSouhaitee || demande.datePreferee || '').toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        
                        {demande.creneau && (
                          <div className="text-sm text-success mt-1">
                            ✅ <strong>Créneau confirmé:</strong> {formatTime(demande.creneau.dateDebut)} - {formatTime(demande.creneau.dateFin)} avec {demande.creneau.technicienNom}
                          </div>
                        )}
                        
                        {demande.commentaire && (
                          <div className="text-sm text-bodydark2 mt-2 italic bg-bodydark1/5 p-2 rounded">
                            💬 "{demande.commentaire}"
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-bodydark2 mb-2">
                          Demandé le<br />
                          {new Date(demande.createdAt || demande.dateCreation || '').toLocaleDateString('fr-FR')}
                        </div>
                        
                        {demande.statut === 'EnAttente' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleCancelDemande(demande.id)}
                          >
                            Annuler
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {demande.statut === 'Confirmee' && demande.creneau && (
                      <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-xl text-success text-sm flex items-center">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          RDV confirmé pour le {new Date(demande.creneau.dateDebut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} de {formatTime(demande.creneau.dateDebut)} à {formatTime(demande.creneau.dateFin)}
                        </span>
                      </div>
                    )}
                    
                    {demande.statut === 'Refusee' && (
                      <div className="mt-4 p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm flex items-center">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Demande refusée. Veuillez créer une nouvelle demande avec des disponibilités différentes.</span>
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
