# 🔧 SAV Microservices - Système de Gestion du Service Après-Vente

<p align="center">
  <img src="https://img.shields.io/badge/.NET-8.0-512BD4?style=for-the-badge&logo=dotnet" alt=".NET 8" />
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.2-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/SQL_Server-2022-CC2927?style=for-the-badge&logo=microsoft-sql-server" alt="SQL Server" />
</p>

## 📋 Table des matières

- [Présentation](#-présentation)
- [Architecture](#-architecture)
- [Technologies](#-technologies)
- [Microservices](#-microservices)
- [Fonctionnalités](#-fonctionnalités)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Démarrage](#-démarrage)
- [API Endpoints](#-api-endpoints)
- [Structure du projet](#-structure-du-projet)
- [Rôles et permissions](#-rôles-et-permissions)

---

## 🎯 Présentation

**SAV Microservices** est une application complète de gestion du Service Après-Vente construite avec une architecture microservices. Elle permet de gérer l'ensemble du cycle de vie du SAV : de la réclamation client jusqu'à l'intervention technique et le paiement.

### Objectifs du projet

- 📝 Gestion des réclamations clients
- 👨‍🔧 Planification et suivi des interventions techniques
- 📦 Gestion des articles et pièces détachées
- 💳 Traitement des paiements (intégration Stripe)
- 📊 Tableaux de bord analytiques
- 📅 Calendriers interactifs pour le suivi

---

## 🏗 Architecture

Le projet suit une **architecture microservices** avec un **API Gateway** (Ocelot) comme point d'entrée unique.

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                        http://localhost:3000                    │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY (Ocelot)                        │
│                   https://localhost:5000                        │
└────────────────────────────────┬────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   Auth Service  │   │ Clients Service │   │Interventions    │
│   Port: 5001    │   │   Port: 5002    │   │Service Port:5003│
├─────────────────┤   ├─────────────────┤   ├─────────────────┤
│ • Authentification│ │ • Clients       │   │ • Interventions │
│ • JWT Tokens    │   │ • Réclamations  │   │ • Techniciens   │
│ • Refresh Tokens│   │ • Articles      │   │ • Évaluations   │
│ • Password Reset│   │   Achetés       │   │ • RDV           │
└────────┬────────┘   └────────┬────────┘   │ • Export        │
         │                     │            └────────┬────────┘
         ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│Articles Service │   │Payments Service │   │                 │
│   Port: 5004    │   │   Port: 5005    │   │   SQL Server    │
├─────────────────┤   ├─────────────────┤   │    Databases    │
│ • Articles      │   │ • Stripe        │   │                 │
│ • Catégories    │   │   Integration   │   │                 │
│ • Pièces        │   │ • Factures      │   │                 │
│   Détachées     │   │                 │   │                 │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

### Pattern Clean Architecture

Chaque microservice suit le pattern **Clean Architecture** avec 4 couches :

```
Service/
├── API/              # Controllers, Middlewares, Configuration
├── Application/      # Services, DTOs, Interfaces
├── Domain/           # Entities, Enums, Value Objects
└── Infrastructure/   # EF Core, Repositories, External APIs
```

---

## 🛠 Technologies

### Backend
| Technologie | Version | Description |
|------------|---------|-------------|
| .NET | 8.0 | Framework principal |
| ASP.NET Core | 8.0 | Web API |
| Entity Framework Core | 8.0 | ORM |
| Ocelot | 23.x | API Gateway |
| SQL Server | 2022 | Base de données |
| JWT Bearer | - | Authentification |
| ASP.NET Identity | 8.0 | Gestion des utilisateurs |
| Stripe.NET | - | Paiements |

### Frontend
| Technologie | Version | Description |
|------------|---------|-------------|
| React | 18.2 | Framework UI |
| TypeScript | 5.2 | Typage statique |
| Vite | 5.0 | Build tool |
| TanStack Query | 5.12 | Data fetching |
| React Router | 6.20 | Routing |
| Zustand | 4.4 | State management |
| React Hook Form | 7.48 | Formulaires |
| Tailwind CSS | 3.3 | Styling |
| Recharts | 2.10 | Graphiques |
| date-fns | 2.30 | Manipulation des dates |

---

## 🔌 Microservices

### 1. Auth Service (Port 5001)
Gère l'authentification et l'autorisation.

**Entités :**
- `ApplicationUser` - Utilisateur avec rôle
- `RefreshToken` - Tokens de rafraîchissement
- `PasswordResetOtp` - Réinitialisation mot de passe

**Endpoints :**
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh-token` - Rafraîchir le token
- `POST /api/auth/forgot-password` - Mot de passe oublié
- `POST /api/auth/change-password` - Changer mot de passe

### 2. Clients Service (Port 5002)
Gère les clients, leurs achats et réclamations.

**Entités :**
- `Client` - Profil client
- `ArticleAchat` - Articles achetés par le client
- `Reclamation` - Réclamations SAV

**Endpoints :**
- `GET/POST /api/clients` - CRUD clients
- `GET/POST /api/reclamations` - CRUD réclamations
- `GET/POST /api/articles-achetes` - CRUD articles achetés

### 3. Interventions Service (Port 5003)
Gère les interventions techniques et les techniciens.

**Entités :**
- `Intervention` - Intervention technique
- `Technicien` - Profil technicien
- `Evaluation` - Évaluation du client
- `PieceUtilisee` - Pièces utilisées
- `Rdv` - Rendez-vous

**Endpoints :**
- `GET/POST /api/interventions` - CRUD interventions
- `GET/POST /api/techniciens` - CRUD techniciens
- `GET/POST /api/evaluations` - CRUD évaluations
- `GET/POST /api/rdv` - CRUD rendez-vous
- `GET /api/export` - Export de données

### 4. Articles Service (Port 5004)
Gère le catalogue d'articles et le stock.

**Entités :**
- `Article` - Produit/article
- `Categorie` - Catégorie d'article
- `PieceDetachee` - Pièce de rechange

**Endpoints :**
- `GET/POST /api/articles` - CRUD articles
- `GET/POST /api/categories` - CRUD catégories
- `GET/POST /api/pieces-detachees` - CRUD pièces

### 5. Payments Service (Port 5005)
Gère les paiements via Stripe.

**Endpoints :**
- `POST /api/payments/create-session` - Créer session paiement
- `POST /api/payments/webhook` - Webhook Stripe
- `GET /api/payments` - Liste des paiements

### 6. API Gateway (Port 5000)
Point d'entrée unique utilisant Ocelot.

**Fonctionnalités :**
- Routage des requêtes
- Authentification JWT
- Rate limiting
- Load balancing

---

## ✨ Fonctionnalités

### 👤 Client
- ✅ Inscription et connexion
- ✅ Création et gestion du profil
- ✅ Consultation des articles achetés
- ✅ Création de réclamations
- ✅ Suivi des réclamations
- ✅ Demande de rendez-vous
- ✅ Évaluation des interventions
- ✅ Paiement en ligne (Stripe)
- ✅ Calendrier personnel

### 👨‍🔧 Technicien
- ✅ Tableau de bord personnalisé
- ✅ Liste des interventions assignées
- ✅ Mise à jour du statut des interventions
- ✅ Calendrier des interventions
- ✅ Gestion de la disponibilité

### 👨‍💼 Responsable SAV
- ✅ Tableau de bord analytique
- ✅ Gestion des clients
- ✅ Gestion des réclamations
- ✅ Création et assignation d'interventions
- ✅ Gestion des techniciens
- ✅ Gestion des articles et catégories
- ✅ Gestion du stock (pièces détachées)
- ✅ Gestion des rendez-vous
- ✅ Visualisation des évaluations
- ✅ Export de données
- ✅ Statistiques et rapports
- ✅ Gestion des paiements

---

## 📋 Prérequis

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- [SQL Server 2019+](https://www.microsoft.com/sql-server) ou LocalDB
- [Visual Studio 2022](https://visualstudio.microsoft.com/) ou [VS Code](https://code.visualstudio.com/)

---

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/A-Hamdi1/SAV-Micorservices.git
cd SAV-Micorservices
```

### 2. Configuration des bases de données

Chaque microservice utilise sa propre base de données. Les migrations EF Core créeront automatiquement les tables.

### 3. Installer les dépendances Frontend

```bash
cd frontend
npm install
```

### 4. Configurer les variables d'environnement

Copier et configurer les fichiers `appsettings.json` pour chaque service.

---

## ⚙️ Configuration

### Configuration des Connection Strings

Chaque service a son propre `appsettings.json`. Exemple pour Auth Service :

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=SAV_Auth;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "VotreCleSecreteJWT",
    "Issuer": "SAV.Auth",
    "Audience": "SAV.Services"
  }
}
```

### Configuration Stripe (Payments Service)

```json
{
  "Stripe": {
    "SecretKey": "sk_test_...",
    "PublishableKey": "pk_test_...",
    "WebhookSecret": "whsec_..."
  }
}
```

---

## ▶️ Démarrage

### Option 1 : Script batch (Windows)

```bash
# À la racine du projet
start-all-services.bat
```

Ce script démarre tous les services dans l'ordre :
1. Auth API (5001)
2. Clients API (5002)
3. Interventions API (5003)
4. Articles API (5004)
5. Payments API (5005)
6. Gateway (5000)

### Option 2 : Démarrage manuel

```bash
# Terminal 1 - Auth Service
cd src/Services/Auth/SAV.Auth.API
dotnet run

# Terminal 2 - Clients Service
cd src/Services/Clients/SAV.Clients.API
dotnet run

# Terminal 3 - Interventions Service
cd src/Services/Interventions/SAV.Interventions.API
dotnet run

# Terminal 4 - Articles Service
cd src/Services/Articles/SAV.Articles.API
dotnet run

# Terminal 5 - Payments Service
cd src/Services/Payments/SAV.Payments.API
dotnet run

# Terminal 6 - Gateway
cd src/Gateway/SAV.Gateway
dotnet run
```

### Démarrage du Frontend

```bash
cd frontend
npm run dev
```

Le frontend sera accessible sur `http://localhost:3000`

---

## 📡 API Endpoints

### Accès Swagger

| Service | URL Swagger |
|---------|-------------|
| Auth | https://localhost:5001/swagger |
| Clients | https://localhost:5002/swagger |
| Interventions | https://localhost:5003/swagger |
| Articles | https://localhost:5004/swagger |
| Payments | https://localhost:5005/swagger |

### Via Gateway (Production)

Toutes les requêtes passent par le Gateway : `https://localhost:5000/api/...`

---

## 📁 Structure du projet

```
SAV-Microservices/
├── frontend/                    # Application React
│   ├── src/
│   │   ├── api/                # Clients API (axios)
│   │   ├── components/         # Composants réutilisables
│   │   │   ├── common/         # Button, Card, Modal, etc.
│   │   │   └── layout/         # Header, Sidebar, Layout
│   │   ├── pages/              # Pages par rôle
│   │   │   ├── auth/           # Login, Register
│   │   │   ├── client/         # Pages client
│   │   │   ├── responsable/    # Pages responsable SAV
│   │   │   └── technicien/     # Pages technicien
│   │   ├── store/              # Zustand stores
│   │   ├── types/              # TypeScript types
│   │   └── utils/              # Utilitaires
│   ├── package.json
│   └── vite.config.ts
│
├── src/
│   ├── Gateway/
│   │   └── SAV.Gateway/        # Ocelot API Gateway
│   │
│   ├── Services/
│   │   ├── Auth/               # Service d'authentification
│   │   │   ├── SAV.Auth.API/
│   │   │   ├── SAV.Auth.Application/
│   │   │   ├── SAV.Auth.Domain/
│   │   │   └── SAV.Auth.Infrastructure/
│   │   │
│   │   ├── Clients/            # Service clients
│   │   │   ├── SAV.Clients.API/
│   │   │   ├── SAV.Clients.Application/
│   │   │   ├── SAV.Clients.Domain/
│   │   │   └── SAV.Clients.Infrastructure/
│   │   │
│   │   ├── Interventions/      # Service interventions
│   │   │   ├── SAV.Interventions.API/
│   │   │   ├── SAV.Interventions.Application/
│   │   │   ├── SAV.Interventions.Domain/
│   │   │   └── SAV.Interventions.Infrastructure/
│   │   │
│   │   ├── Articles/           # Service articles
│   │   │   ├── SAV.Articles.API/
│   │   │   ├── SAV.Articles.Application/
│   │   │   ├── SAV.Articles.Domain/
│   │   │   └── SAV.Articles.Infrastructure/
│   │   │
│   │   └── Payments/           # Service paiements
│   │       ├── SAV.Payments.API/
│   │       ├── SAV.Payments.Application/
│   │       ├── SAV.Payments.Domain/
│   │       └── SAV.Payments.Infrastructure/
│   │
│   └── Shared/
│       ├── SAV.Shared.Common/  # Code partagé
│       └── SAV.Shared.DTOs/    # DTOs partagés
│
├── SAV.MicroServices.sln       # Solution Visual Studio
├── start-all-services.bat      # Script de démarrage
└── README.md
```

---

## 👥 Rôles et permissions

| Fonctionnalité | Client | Technicien | ResponsableSAV |
|---------------|:------:|:----------:|:--------------:|
| Voir son profil | ✅ | ✅ | ✅ |
| Créer réclamation | ✅ | ❌ | ✅ |
| Voir ses réclamations | ✅ | ❌ | ✅ |
| Évaluer intervention | ✅ | ❌ | ❌ |
| Voir ses interventions | ❌ | ✅ | ✅ |
| Modifier statut intervention | ❌ | ✅ | ✅ |
| Gérer clients | ❌ | ❌ | ✅ |
| Gérer techniciens | ❌ | ❌ | ✅ |
| Gérer articles | ❌ | ❌ | ✅ |
| Créer interventions | ❌ | ❌ | ✅ |
| Voir statistiques | ❌ | ❌ | ✅ |
| Export données | ❌ | ❌ | ✅ |

---

## 📊 Statuts

### Statuts Réclamation
| Statut | Description |
|--------|-------------|
| `EnAttente` | Nouvelle réclamation, en attente de traitement |
| `EnCours` | Réclamation en cours de traitement |
| `Resolue` | Réclamation résolue avec succès |
| `Rejetee` | Réclamation rejetée |

### Statuts Intervention
| Statut | Description |
|--------|-------------|
| `Planifiee` | Intervention planifiée |
| `EnCours` | Intervention en cours d'exécution |
| `Terminee` | Intervention terminée |
| `Annulee` | Intervention annulée |

---

## 🧪 Tests

```bash
# Lancer les tests unitaires
dotnet test

# Lancer ESLint sur le frontend
cd frontend
npm run lint
```

---

## 📝 Licence

Ce projet est développé dans le cadre d'un atelier .NET.

---

## 👨‍💻 Auteur

Développé avec ❤️ pour l'apprentissage de l'architecture microservices avec .NET et React.
