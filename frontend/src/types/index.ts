// Auth Types
export interface User {
  id: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  email: string;
  role: string;
  expiresIn: number;
}

export interface RegisterDto {
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

// Client Types
export interface ClientDto {
  id: number;
  userId: string;
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  createdAt: string;
}

export interface CreateClientDto {
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
}

export interface UpdateClientDto {
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
}

export interface CreateClientByResponsableDto {
  userId: string;
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
}

// Article Types
export interface ArticleDto {
  id: number;
  reference: string;
  nom: string;
  categorie: string;
  prixVente: number;
  dureeGarantie: number;
  createdAt: string;
}

export interface CreateArticleDto {
  reference: string;
  nom: string;
  categorie: string;
  prixVente: number;
  dureeGarantie: number;
}

export interface UpdateArticleDto {
  nom: string;
  categorie: string;
  prixVente: number;
  dureeGarantie: number;
}

export interface ArticleListDto {
  items: ArticleDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface PieceDetacheeDto {
  id: number;
  articleId: number;
  nom: string;
  reference: string;
  prix: number;
  stock: number;
}

export interface CreatePieceDetacheeDto {
  articleId: number;
  nom: string;
  reference: string;
  prix: number;
  stock: number;
}

// Article Achat Types
export interface ArticleAchatDto {
  id: number;
  clientId: number;
  articleId: number;
  articleNom: string;
  articleReference: string;
  dateAchat: string;
  numeroSerie: string;
  sousGarantie: boolean;
  dureeGarantieJours: number;
}

export interface CreateArticleAchatDto {
  articleId: number;
  dateAchat: string;
  numeroSerie: string;
}

export interface UpdateArticleAchatDto {
  dateAchat: string;
  numeroSerie: string;
  dureeGarantieJours: number;
}

export interface ArticleAchatStatsDto {
  nombreTotalArticles: number;
  nombreArticlesSousGarantie: number;
  nombreArticlesHorsGarantie: number;
  pourcentageSousGarantie: number;
  garantiesExpirantProchainement: ArticleAchatExpirationDto[];
}

export interface ArticleAchatExpirationDto {
  id: number;
  clientNom: string;
  articleNom: string;
  numeroSerie: string;
  dateExpiration: string;
  joursRestants: number;
}

// Reclamation Types
export interface ReclamationDto {
  id: number;
  clientId: number;
  clientNom: string;
  clientPrenom: string;
  articleAchatId: number;
  articleNom: string;
  description: string;
  statut: string;
  dateCreation: string;
  dateResolution?: string;
  commentaireResponsable?: string;
}

export interface CreateReclamationDto {
  articleAchatId: number;
  description: string;
}

export interface UpdateReclamationStatutDto {
  statut: string;
  commentaireResponsable?: string;
}

export interface ReclamationListDto {
  items: ReclamationDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Intervention Types
export interface InterventionDto {
  id: number;
  reclamationId: number;
  technicienNom: string;
  dateIntervention: string;
  statut: string;
  estGratuite: boolean;
  montantMainOeuvre?: number;
  montantTotal: number;
  commentaire?: string;
  createdAt: string;
  piecesUtilisees: PieceUtiliseeDto[];
}

export interface CreateInterventionDto {
  reclamationId: number;
  technicienId: number;
  dateIntervention: string;
  montantMainOeuvre?: number;
  commentaire?: string;
}

export interface UpdateInterventionDto {
  technicienNom: string;
  dateIntervention: string;
  montantMainOeuvre?: number;
  commentaire?: string;
}

export interface UpdateInterventionStatutDto {
  statut: string;
}

export interface PieceUtiliseeDto {
  id: number;
  interventionId: number;
  pieceDetacheeId: number;
  pieceNom: string;
  pieceReference: string;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
}

export interface AddPieceUtiliseeDto {
  pieceDetacheeId: number;
  quantite: number;
}

export interface InterventionListDto {
  items: InterventionDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface UpdateInterventionTechnicienDto {
  technicienId: number;
}

// Technicien Types
export interface TechnicienDto {
  id: number;
  nom: string;
  prenom: string;
  nomComplet: string;
  email: string;
  telephone: string;
  specialite: string;
  estDisponible: boolean;
  dateEmbauche: string;
  createdAt: string;
  nombreInterventions: number;
}

export interface TechnicienDetailsDto {
  id: number;
  nom: string;
  prenom: string;
  nomComplet: string;
  email: string;
  telephone: string;
  specialite: string;
  estDisponible: boolean;
  dateEmbauche: string;
  createdAt: string;
  interventions: InterventionDto[];
  stats?: TechnicienStatsDto;
}

export interface CreateTechnicienDto {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  specialite: string;
  dateEmbauche?: string;
}

export interface UpdateTechnicienDto {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  specialite: string;
  estDisponible: boolean;
}

export interface UpdateTechnicienDisponibiliteDto {
  estDisponible: boolean;
}

export interface TechnicienStatsDto {
  nombreInterventionsTotal: number;
  nombreInterventionsTerminees: number;
  nombreInterventionsEnCours: number;
  tauxReussite: number;
  chiffreAffaireTotal: number;
  chiffreAffaireMoyen: number;
}

export interface TechniciensStatsGlobalesDto {
  nombreTechniciensTotal: number;
  nombreTechniciensDisponibles: number;
  nombreInterventionsTotal: number;
  chiffreAffaireTotal: number;
  tauxReussiteMoyen: number;
  topTechniciens: TechnicienStatsSummaryDto[];
}

export interface TechnicienStatsSummaryDto {
  id: number;
  nomComplet: string;
  nombreInterventions: number;
  chiffreAffaire: number;
  tauxReussite: number;
}

// Stats Types
export interface ArticleStatsDto {
  nombreTotalArticles: number;
  nombrePiecesDetachees: number;
  valeurStockTotal: number;
  prixMoyenArticle: number;
  parCategorie: ArticleCategoryStatsDto[];
  articlesLesPlusVendus: ArticleTopDto[];
}

export interface ArticleCategoryStatsDto {
  categorie: string;
  nombre: number;
  prixMoyen: number;
}

export interface ArticleTopDto {
  id: number;
  nom: string;
  reference: string;
  categorie: string;
  nombreVentes: number;
}

export interface InterventionStatsDto {
  nombreTotal: number;
  nombrePlanifiees: number;
  nombreEnCours: number;
  nombreTerminees: number;
  nombreAnnulees: number;
  montantTotalGenere: number;
  montantMoyen: number;
  dureeMoyenneJours: number;
  parMois: InterventionStatsByMonthDto[];
}

export interface InterventionStatsByMonthDto {
  annee: number;
  mois: number;
  moisNom: string;
  nombre: number;
  montant: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

