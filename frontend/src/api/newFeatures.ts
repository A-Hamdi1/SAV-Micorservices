import api from './axios';

// =============== PAYMENTS ===============
export interface Payment {
  id: number;
  interventionId: number;
  clientId: number;
  montant: number;
  statut: string;
  methode: string;
  numeroTransaction?: string;
  description?: string;
  createdAt: string;
  paidAt?: string;
  receiptUrl?: string;
}

export interface CreateCheckoutRequest {
  interventionId: number;
  clientId: number;
  montant: number;
  description?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateManualPaymentRequest {
  interventionId: number;
  clientId: number;
  montant: number;
  methode: string;
  description?: string;
  numeroTransaction?: string;
}

export interface PaymentStats {
  // Noms correspondant au backend PaymentStatsDto
  totalRevenue: number;
  revenueThisMonth: number;
  totalPayments: number;
  pendingPayments: number;
  successfulPayments: number;
  failedPayments: number;
  // Aliases pour compatibilité (utiliser les noms backend)
  totalPaiements?: number; // alias de totalPayments
  montantTotal?: number; // alias de totalRevenue
  paiementsReussis?: number; // alias de successfulPayments
  paiementsEchoues?: number; // alias de failedPayments
  paiementsEnAttente?: number; // alias de pendingPayments
}

export const paymentsApi = {
  getAll: () =>
    api.get<{ data: Payment[] }>('/api/payments'),
    
  getById: (id: number) =>
    api.get<{ data: Payment }>(`/api/payments/${id}`),
  
  createCheckoutSession: (data: CreateCheckoutRequest) =>
    api.post<{ data: { sessionUrl: string } }>('/api/payments/checkout', data),
  
  confirmPayment: (interventionId: number) =>
    api.post<{ data: Payment }>(`/api/payments/confirm/${interventionId}`),
  
  getByInterventionId: (interventionId: number) =>
    api.get<{ data: Payment }>(`/api/payments/intervention/${interventionId}`),
  
  getByFactureId: (factureId: number) =>
    api.get<{ data: Payment }>(`/api/payments/facture/${factureId}`),
    
  getByClientId: (clientId: number) =>
    api.get<{ data: Payment[] }>(`/api/payments/client/${clientId}`),
  
  recordManualPayment: (data: CreateManualPaymentRequest) =>
    api.post<{ data: Payment }>('/api/payments/manual', data),
  
  refund: (paymentId: number) =>
    api.post<{ data: Payment }>(`/api/payments/${paymentId}/refund`),
  
  getStats: () =>
    api.get<{ data: PaymentStats }>('/api/payments/stats'),
};

// =============== EVALUATIONS ===============
export interface Evaluation {
  id: number;
  interventionId: number;
  clientId: number;
  note: number;
  commentaire?: string;
  recommandeTechnicien: boolean;
  createdAt: string;
  technicienNom?: string;
}

export interface CreateEvaluationRequest {
  interventionId: number;
  clientId: number;
  note: number;
  commentaire?: string;
  recommandeTechnicien: boolean;
}

export interface UpdateEvaluationRequest {
  note: number;
  commentaire?: string;
  recommandeTechnicien: boolean;
}

export interface EvaluationStats {
  totalEvaluations: number;
  noteMoyenne: number;
  notesCinqEtoiles: number;
  notesQuatreEtoiles: number;
  notesTroisEtoiles: number;
  notesDeuxEtoiles: number;
  notesUneEtoile: number;
  tauxRecommandation: number;
}

export interface TechnicienEvaluationStats {
  technicienId: number;
  technicienNom: string;
  nombreEvaluations: number;
  noteMoyenne: number;
  tauxRecommandation: number;
}

export const evaluationsApi = {
  getAll: () =>
    api.get<{ data: Evaluation[] }>('/api/evaluations'),
    
  getById: (id: number) =>
    api.get<{ data: Evaluation }>(`/api/evaluations/${id}`),
  
  create: (data: CreateEvaluationRequest) =>
    api.post<{ data: Evaluation }>('/api/evaluations', data),
  
  update: (id: number, data: UpdateEvaluationRequest) =>
    api.put<{ data: Evaluation }>(`/api/evaluations/${id}`, data),
    
  delete: (id: number) =>
    api.delete(`/api/evaluations/${id}`),
  
  getByIntervention: (interventionId: number) =>
    api.get<{ data: Evaluation }>(`/api/evaluations/intervention/${interventionId}`),
  
  getByClient: (clientId: number) =>
    api.get<{ data: Evaluation[] }>(`/api/evaluations/client/${clientId}`),
  
  getByTechnicien: (technicienId: number) =>
    api.get<{ data: Evaluation[] }>(`/api/evaluations/technicien/${technicienId}`),
  
  getStats: () =>
    api.get<{ data: EvaluationStats }>('/api/evaluations/stats'),
  
  getTechnicienStats: (technicienId: number) =>
    api.get<{ data: TechnicienEvaluationStats }>(`/api/evaluations/stats/technicien/${technicienId}`),
};

// =============== RDV ===============
export interface CreneauDisponible {
  id: number;
  technicienId: number;
  technicienNom: string;
  dateDebut: string;
  dateFin: string;
  estReserve: boolean;
  interventionId?: number;
}

export interface CreneauxPaginatedResult {
  creneaux: CreneauDisponible[];
  totalCount: number;
  totalLibres: number;
  totalReserves: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DemandeRdv {
  id: number;
  reclamationId?: number; // Nullable - RDV peut être indépendant
  clientId: number;
  creneauId?: number;
  creneau?: CreneauDisponible;
  motif: string; // Motif de la demande
  dateSouhaitee?: string;
  preferenceMoment?: string;
  statut: string;
  commentaire?: string;
  createdAt: string;
  traiteeAt?: string;
  // Aliases pour compatibilité frontend
  datePreferee?: string; // alias de dateSouhaitee
  creneauPreference?: string; // alias de preferenceMoment
  dateCreation?: string; // alias de createdAt
  creneauAttribueId?: number; // alias de creneauId
}

export interface CreateCreneauRequest {
  technicienId: number;
  dateDebut: string;
  dateFin: string;
}

export interface CreateCreneauxRecurrentsRequest {
  technicienId: number;
  dateDebut: string;
  dateFin: string;
  dureeMinutes: number;
  jours: number[];
  heureDebut: string;
  heureFin: string;
}

export interface CreateDemandeRdvRequest {
  reclamationId?: number; // Optionnel - RDV peut être indépendant
  clientId: number;
  motif: string; // Motif obligatoire
  creneauId?: number; // Créneau sélectionné par le client
  dateSouhaitee?: string;
  preferenceMoment?: string;
  commentaire?: string;
  // Aliases pour compatibilité frontend
  datePreferee?: string; // sera mappé vers dateSouhaitee
  creneauPreference?: string; // sera mappé vers preferenceMoment
}

export interface TraiterDemandeRdvRequest {
  creneauId?: number;
  accepter: boolean;
  commentaire?: string;
}

export const rdvApi = {
  getCreneauxDisponibles: (dateDebut: string, dateFin: string, technicienId?: number) =>
    api.get<{ data: CreneauDisponible[] }>('/api/rdv/creneaux', {
      params: { dateDebut, dateFin, technicienId }
    }),
  
  getAllCreneaux: (dateDebut: string, dateFin: string, page: number = 1, pageSize: number = 20, technicienId?: number) =>
    api.get<{ data: CreneauxPaginatedResult }>('/api/rdv/creneaux/all', {
      params: { dateDebut, dateFin, page, pageSize, technicienId }
    }),
  
  createCreneau: (data: CreateCreneauRequest) =>
    api.post<{ data: CreneauDisponible }>('/api/rdv/creneaux', data),
    
  createCreneauxRecurrents: (data: CreateCreneauxRecurrentsRequest) =>
    api.post<{ data: CreneauDisponible[] }>('/api/rdv/creneaux/recurrents', data),
  
  deleteCreneau: (id: number) =>
    api.delete(`/api/rdv/creneaux/${id}`),
    
  reserverCreneau: (id: number, interventionId: number) =>
    api.post<{ data: CreneauDisponible }>(`/api/rdv/creneaux/${id}/reserver`, { interventionId }),
    
  libererCreneau: (id: number) =>
    api.post(`/api/rdv/creneaux/${id}/liberer`),
  
  getCreneauxByTechnicien: (technicienId: number, date?: string) =>
    api.get<{ data: CreneauDisponible[] }>(`/api/rdv/creneaux/technicien/${technicienId}`, {
      params: { date }
    }),
  
  // Demandes RDV
  getDemandesRdv: (statut?: string) =>
    api.get<{ data: DemandeRdv[] }>('/api/rdv/demandes', {
      params: { statut }
    }),
  
  getDemandeById: (id: number) =>
    api.get<{ data: DemandeRdv }>(`/api/rdv/demandes/${id}`),
  
  createDemande: (data: CreateDemandeRdvRequest) => {
    // Mapper les propriétés frontend vers backend
    const backendData = {
      reclamationId: data.reclamationId,
      clientId: data.clientId,
      motif: data.motif,
      creneauId: data.creneauId,
      dateSouhaitee: data.dateSouhaitee || data.datePreferee,
      preferenceMoment: data.preferenceMoment || data.creneauPreference,
      commentaire: data.commentaire
    };
    return api.post<{ data: DemandeRdv }>('/api/rdv/demandes', backendData);
  },
  
  getDemandesByClient: (clientId: number) =>
    api.get<{ data: DemandeRdv[] }>(`/api/rdv/demandes/client/${clientId}`),
  
  traiterDemande: (id: number, data: TraiterDemandeRdvRequest) =>
    api.post<{ data: DemandeRdv }>(`/api/rdv/demandes/${id}/traiter`, data),
    
  annulerDemande: (id: number) =>
    api.post<{ data: DemandeRdv }>(`/api/rdv/demandes/${id}/annuler`),
  
  getDemandesEnAttente: () =>
    api.get<{ data: DemandeRdv[] }>('/api/rdv/demandes', {
      params: { statut: 'EnAttente' }
    }),
  
  accepterDemande: (demandeId: number, creneauId: number) =>
    api.post<{ data: DemandeRdv }>(`/api/rdv/demandes/${demandeId}/traiter`, {
      creneauId,
      accepter: true
    }),
  
  refuserDemande: (demandeId: number, commentaire?: string) =>
    api.post<{ data: DemandeRdv }>(`/api/rdv/demandes/${demandeId}/traiter`, {
      accepter: false,
      commentaire
    }),
  
  genererCreneaux: (
    technicienId: number,
    dateDebut: string,
    dateFin: string,
    heureDebut: number,
    heureFin: number,
    dureeMinutes: number
  ) =>
    api.post<{ data: CreneauDisponible[] }>('/api/rdv/creneaux/recurrents', {
      technicienId,
      dateDebut,
      dateFin,
      dureeMinutes,
      jours: [1, 2, 3, 4, 5], // Lundi à Vendredi par défaut
      heureDebut: `${heureDebut.toString().padStart(2, '0')}:00:00`,
      heureFin: `${heureFin.toString().padStart(2, '0')}:00:00`
    }),
};

// =============== ANALYTICS ===============
export interface InterventionStats {
  totalInterventions: number;
  interventionsTerminees: number;
  interventionsEnCours: number;
  interventionsPlanifiees: number;
  interventionsAnnulees: number;
  chiffreAffairesTotal: number;
  chiffreAffairesMois: number;
  tauxResolution: number;
  tempsMoyenResolution: number;
  interventionsSousGarantie: number;
}

export interface AnalyticsData {
  interventionStats: InterventionStats;
  chiffreAffairesMensuel: ChiffreAffairesMensuel[];
  interventionsParStatut: InterventionsParStatut[];
  topTechniciens: TechnicienPerformance[];
  topArticlesProblemes: ArticleProbleme[];
  interventionsParJour: InterventionsParJour[];
  // Propriétés calculées pour compatibilité (extraites de interventionStats)
  tauxResolutionPremierPassage?: number;
  delaiMoyenIntervention?: number;
  satisfactionClientMoyenne?: number;
  technicienPerformances?: TechnicienPerformance[];
  articlesProblematiques?: ArticleProbleme[];
}

export interface ChiffreAffairesMensuel {
  mois: number;
  annee: number;
  moisNom: string;
  montant: number;
  nombreInterventions: number;
  // Aliases pour compatibilité
  montantHT?: number;
  montantTTC?: number;
  nombreFactures?: number;
}

export interface InterventionsParStatut {
  statut: string;
  nombre: number;
  pourcentage: number;
}

export interface TechnicienPerformance {
  technicienId: number;
  technicienNom: string;
  nombreInterventions: number;
  interventionsTerminees: number;
  tauxReussite: number;
  dureeMoyenne: number;
  noteMoyenne: number;
  chiffreAffaires: number;
}

export interface ArticleProbleme {
  articleId: number;
  articleNom: string;
  nombreReclamations: number;
  tauxProbleme?: number;
}

export interface InterventionsParJour {
  date: string;
  nombre: number;
}

export const analyticsApi = {
  getAnalytics: (dateDebut?: string, dateFin?: string) =>
    api.get<{ data: AnalyticsData }>('/api/interventions/analytics', {
      params: { dateDebut, dateFin }
    }),
};

// =============== EXPORT ===============
export const exportApi = {
  exportInterventions: (dateDebut?: string, dateFin?: string, technicienId?: number, statut?: string) =>
    api.get('/api/export/interventions', {
      params: { dateDebut, dateFin, technicienId, statut },
      responseType: 'blob'
    }),
  
  exportReclamations: (dateDebut?: string, dateFin?: string, clientId?: number, statut?: string) =>
    api.get('/api/export/reclamations', {
      params: { dateDebut, dateFin, clientId, statut },
      responseType: 'blob'
    }),
  
  exportFactures: (dateDebut?: string, dateFin?: string) =>
    api.get('/api/export/factures', {
      params: { dateDebut, dateFin },
      responseType: 'blob'
    }),
  
  exportTechniciensStats: (mois?: number, annee?: number) =>
    api.get('/api/export/techniciens-stats', {
      params: { mois, annee },
      responseType: 'blob'
    }),
  
  exportRapportMensuel: (annee: number, mois: number) =>
    api.get(`/api/export/rapport-mensuel/${annee}/${mois}`, {
      responseType: 'blob'
    }),
};

// =============== STOCK ===============
export interface MouvementStock {
  id: number;
  pieceDetacheeId: number;
  nomPiece: string;
  typeMouvement: string;
  quantite: number;
  stockAvant: number;
  stockApres: number;
  raison?: string;
  interventionId?: number;
  dateMouvement: string;
}

export interface StockStats {
  totalPieces: number;
  totalStockItems: number;
  valeurTotaleStock: number;
  piecesEnAlerte: number;
  piecesRuptureStock: number;
  piecesLesPlusUtilisees: TopPiece[];
  piecesEnAlerteDetails: PieceAlerte[];
  mouvementsRecents: MouvementStockRecent[];
}

export interface TopPiece {
  id: number;
  nom: string;
  reference: string;
  nombreUtilisations: number;
  stockActuel: number;
}

export interface PieceAlerte {
  id: number;
  nom: string;
  reference: string;
  stock: number;
  seuilAlerte: number;
  articleId: number;
  articleNom: string;
}

export interface MouvementStockRecent {
  id: number;
  pieceNom: string;
  typeMouvement: string;
  quantite: number;
  dateMouvement: string;
}

export interface PieceDetachee {
  id: number;
  articleId: number;
  nom: string;
  reference: string;
  prix: number;
  stock: number;
  estEnAlerte?: boolean; // Calculé par le backend
}

export const stockApi = {
  getAllPieces: () =>
    api.get<{ data: PieceDetachee[] }>('/api/pieces-detachees'),
  
  getPiecesByArticle: (articleId: number) =>
    api.get<{ data: PieceDetachee[] }>(`/api/pieces-detachees/article/${articleId}`),
  
  addStock: (pieceId: number, quantite: number) =>
    api.patch<{ data: boolean }>(`/api/pieces-detachees/${pieceId}/stock/add`, { quantite }),
  
  getLowStock: (seuil?: number) =>
    api.get<{ data: PieceDetachee[] }>('/api/pieces-detachees/low-stock', {
      params: { seuil }
    }),
  
  getMouvements: (pieceId: number) =>
    api.get<{ data: MouvementStock[] }>(`/api/pieces-detachees/${pieceId}/mouvements`),
  
  getStats: () =>
    api.get<{ data: StockStats }>('/api/pieces-detachees/stats'),
};

// =============== PDF DOWNLOADS ===============
export const pdfApi = {
  downloadFacture: (interventionId: number) =>
    api.get(`/api/interventions/${interventionId}/facture/pdf`, {
      responseType: 'blob'
    }),
  
  downloadRapportIntervention: (interventionId: number) =>
    api.get(`/api/interventions/${interventionId}/rapport/pdf`, {
      responseType: 'blob'
    }),
  
  downloadRapportMensuel: (annee: number, mois: number) =>
    api.get(`/api/interventions/rapport-mensuel/${annee}/${mois}/pdf`, {
      responseType: 'blob'
    }),
};
