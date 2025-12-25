# SAV Pro - Application de Gestion de Service Après-Vente

## 📋 Vue d'ensemble

**SAV Pro** est une application complète de gestion de Service Après-Vente (SAV) basée sur une architecture microservices. Elle permet aux clients de soumettre des réclamations pour leurs produits et aux responsables SAV de gérer les interventions techniques.

---

## 🏗️ Architecture Technique

### Backend (.NET 8)
| Service | Port | Description |
|---------|------|-------------|
| **Gateway** | 5000 | API Gateway (Ocelot) - Point d'entrée unique |
| **Auth** | 5001 | Authentification JWT & gestion des utilisateurs |
| **Clients** | 5002 | Profils clients, articles achetés, réclamations |
| **Interventions** | 5003 | Interventions, techniciens, RDV, évaluations |
| **Articles** | 5004 | Catalogue produits, pièces détachées |
| **Payments** | 5005 | Paiements (intégration Stripe) |

### Frontend (React 18)
- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand (auth) + TanStack Query (server state)
- **Port**: 3000

---

## 👥 Rôles Utilisateurs

| Rôle | Accès | Création |
|------|-------|----------|
| **Client** | Portail client uniquement | Inscription publique |
| **ResponsableSAV** | Portail administration | Créé manuellement |
| **Admin** | Accès complet | Créé manuellement |

---

## ✨ Fonctionnalités

### Pour les Clients
- ✅ Inscription et connexion sécurisées
- ✅ Gestion du profil personnel
- ✅ Enregistrement des articles achetés (avec numéro de série)
- ✅ Création de réclamations pour signaler des problèmes
- ✅ Suivi en temps réel du statut des réclamations
- ✅ Demande de rendez-vous pour interventions
- ✅ Évaluation des interventions (notes + commentaires)
- ✅ Paiement en ligne des interventions (Stripe)

### Pour les Responsables SAV
- ✅ Tableau de bord avec KPIs et statistiques
- ✅ Gestion complète des clients
- ✅ Gestion du catalogue d'articles
- ✅ Traitement des réclamations
- ✅ Planification et suivi des interventions
- ✅ Gestion des techniciens et leurs disponibilités
- ✅ Gestion du stock de pièces détachées
- ✅ Génération de factures
- ✅ Suivi des paiements
- ✅ Exports de données (Excel/PDF)
- ✅ Analytics et rapports

---

## 🔄 Flux Métier Principal

```
1. Client crée un compte et son profil
           ↓
2. Client enregistre ses articles achetés
           ↓
3. Client crée une réclamation (sélectionne article + description problème)
           ↓
4. Responsable SAV reçoit la réclamation (statut: En Attente)
           ↓
5. Responsable passe la réclamation "En Cours" et crée une intervention
           ↓
6. Technicien est assigné + date planifiée
           ↓
7. Intervention réalisée → ajout des pièces utilisées
           ↓
8. Intervention terminée → facture générée
           ↓
9. Si hors garantie: Client paie via Stripe
           ↓
10. Client peut évaluer l'intervention
           ↓
11. Réclamation marquée "Résolue"
```

---

## 🛡️ Sécurité

- **JWT** pour l'authentification avec refresh tokens
- **Rôles & Permissions** vérifiés à chaque endpoint
- **API Key** pour la communication inter-services
- **HTTPS** obligatoire
- **Validation** des données entrantes

---

## 🚀 Installation & Démarrage

### Prérequis
- .NET 8 SDK
- Node.js 18+
- SQL Server LocalDB

### Démarrage Backend
```bash
# Depuis la racine du projet
./start-all-services.bat
```

### Démarrage Frontend
```bash
cd frontend
npm install
npm run dev
```

### URLs d'accès
- **Frontend**: http://localhost:3000
- **Gateway API**: https://localhost:5000
- **Swagger** (par service): https://localhost:500X/swagger

---

## 🧪 Scénario de Test Manuel

### Préparation
1. Lancer tous les services backend (`start-all-services.bat`)
2. Lancer le frontend (`npm run dev` dans `/frontend`)
3. Ouvrir http://localhost:3000

### Scénario 1: Parcours Client Complet

#### Étape 1: Inscription
1. Cliquer sur **"Créer un compte"**
2. Remplir:
   - Email: `client.test@example.com`
   - Mot de passe: `Test123!@#`
   - Confirmer le mot de passe
3. Cliquer **"S'inscrire"**
4. ✅ Vérifier: Redirection vers `/client/dashboard`

#### Étape 2: Création du profil
1. Aller sur **"Mon profil"** (sidebar)
2. Remplir le formulaire:
   - Nom: `Dupont`
   - Prénom: `Jean`
   - Téléphone: `0612345678`
   - Adresse: `123 Rue de Paris, 75001 Paris`
3. Cliquer **"Créer mon profil"**
4. ✅ Vérifier: Message de succès

#### Étape 3: Enregistrer un article
1. Aller sur **"Mes articles"**
2. Cliquer **"Ajouter un article"**
3. Sélectionner un article dans la liste
4. Remplir:
   - Numéro de série: `SN-2024-001234`
   - Date d'achat: *date du jour*
5. Soumettre
6. ✅ Vérifier: L'article apparaît dans la liste avec son statut de garantie

#### Étape 4: Créer une réclamation
1. Aller sur **"Mes réclamations"**
2. Cliquer **"Nouvelle réclamation"**
3. Sélectionner l'article enregistré
4. Décrire le problème: *"L'appareil ne s'allume plus après une surtension électrique"*
5. Soumettre
6. ✅ Vérifier: Réclamation créée avec statut **"En Attente"**

### Scénario 2: Traitement par le Responsable SAV

#### Préparation
1. Se déconnecter
2. Se connecter avec un compte ResponsableSAV

#### Étape 1: Consulter les réclamations
1. Aller sur **"Réclamations"** (menu admin)
2. ✅ Vérifier: La réclamation du client apparaît

#### Étape 2: Traiter la réclamation
1. Cliquer sur la réclamation
2. Changer le statut en **"En Cours"**
3. Ajouter un commentaire: *"Prise en charge pour diagnostic"*
4. ✅ Vérifier: Statut mis à jour

#### Étape 3: Créer une intervention
1. Cliquer **"Créer une intervention"**
2. Remplir:
   - Technicien: *sélectionner dans la liste*
   - Date: *date future*
   - Coût main d'œuvre: `50` €
   - Commentaire: *"Remplacement du fusible interne"*
3. Soumettre
4. ✅ Vérifier: Intervention créée avec statut **"Planifiée"**

#### Étape 4: Terminer l'intervention
1. Ouvrir l'intervention
2. Ajouter une pièce utilisée (si hors garantie)
3. Changer le statut en **"Terminée"**
4. ✅ Vérifier: Facture générée avec montant total

### Scénario 3: Paiement (si hors garantie)

#### En tant que Client
1. Se reconnecter en tant que client
2. Aller sur les détails de la réclamation
3. Cliquer **"Payer l'intervention"**
4. ✅ Vérifier: Redirection vers Stripe Checkout
5. Utiliser carte test: `4242 4242 4242 4242`
6. ✅ Vérifier: Retour sur page de succès

### Scénario 4: Évaluation

1. Après paiement, un bouton **"Évaluer"** apparaît
2. Cliquer et remplir:
   - Note: ⭐⭐⭐⭐⭐
   - Commentaire: *"Intervention rapide et efficace"*
   - Recommander le technicien: ✅
3. Soumettre
4. ✅ Vérifier: Évaluation enregistrée

---

## 📊 Points de vérification

| Fonctionnalité | Point de test |
|----------------|---------------|
| Auth | Token JWT valide après login |
| Profil | Données persistées en base |
| Articles | Calcul garantie correct (date + durée) |
| Réclamations | Workflow de statuts respecté |
| Interventions | Calcul montant total correct |
| Paiements | Webhook Stripe reçu |
| Évaluations | Note moyenne technicien mise à jour |

---

## 🐛 En cas de problème

1. **Erreur 401** → Vérifier que le token est valide (expiration 1h)
2. **Erreur 500** → Consulter les logs du service concerné
3. **CORS Error** → Vérifier que le frontend tourne sur port 3000
4. **DB Error** → S'assurer que LocalDB est installé et démarré

---

## 📝 Améliorations apportées

1. ✅ Correction encodage UTF-8 (caractères français)
2. ✅ Correction proxy Vite (5010 → 5000)
3. ✅ Synchronisation tokens Zustand/localStorage
4. ✅ Ajout types stricts pour rôles et statuts
5. ✅ ErrorBoundary pour gestion d'erreurs React
6. ✅ Amélioration StatusBadge avec labels français
7. ✅ Configuration staleTime pour React Query
8. ✅ Script démarrage amélioré

---

*Documentation générée le 24/12/2024*
