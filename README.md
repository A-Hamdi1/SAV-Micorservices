# 🔧 SAV Microservices - Système de Gestion du Service Après-Vente

<p align="center">
  <img src="https://img.shields.io/badge/.NET-8.0-512BD4?style=for-the-badge&logo=dotnet" alt=".NET 8" />
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.2-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/SQL_Server-2022-CC2927?style=for-the-badge&logo=microsoft-sql-server" alt="SQL Server" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/SignalR-8.0-512BD4?style=for-the-badge&logo=dotnet" alt="SignalR" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/Status-Active-success?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/Microservices-8-blue?style=flat-square" alt="Microservices" />
</p>

## 📋 Table des matières

- [Présentation](#-présentation)
- [Captures d'écran](#-captures-décran)
- [Architecture](#-architecture)
- [Technologies](#-technologies)
- [Microservices](#-microservices)
- [Fonctionnalités](#-fonctionnalités)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Démarrage](#-démarrage)
- [API Endpoints](#-api-endpoints)
- [Temps Réel (SignalR)](#-temps-réel-signalr)
- [Notifications](#-notifications)
- [Structure du projet](#-structure-du-projet)
- [Rôles et permissions](#-rôles-et-permissions)
- [Tests](#-tests)
- [Contribution](#-contribution)

---

## 🎯 Présentation

**SAV Microservices** est une application complète de gestion du Service Après-Vente construite avec une architecture microservices. Elle permet de gérer l'ensemble du cycle de vie du SAV : de la réclamation client jusqu'à l'intervention technique et le paiement.

### ✨ Points forts

- 🏗️ **Architecture Microservices** - 8 services indépendants et scalables
- 🔐 **Authentification sécurisée** - JWT + Google OAuth 2.0
- ⚡ **Temps réel** - Notifications et messagerie instantanées via SignalR
- 💳 **Paiements intégrés** - Stripe pour les transactions sécurisées
- 📊 **Tableaux de bord** - Analytics et graphiques interactifs
- 📱 **Design moderne** - Interface responsive avec Tailwind CSS
- 🌐 **API Gateway** - Point d'entrée unique avec Ocelot

### Objectifs du projet

| Objectif | Description |
|----------|-------------|
| 📝 **Réclamations** | Gestion complète des réclamations clients |
| 👨‍🔧 **Interventions** | Planification et suivi des interventions techniques |
| 📦 **Articles** | Gestion des articles et pièces détachées |
| 💳 **Paiements** | Traitement des paiements via Stripe |
| 📊 **Analytics** | Tableaux de bord et statistiques |
| 📅 **Calendriers** | Gestion interactive des rendez-vous |
| 🔔 **Notifications** | Alertes en temps réel |
| 💬 **Messagerie** | Chat en temps réel entre utilisateurs |

---

## 📸 Captures d'écran

<details>
<summary>Voir les captures d'écran</summary>

### Page de connexion
Interface de connexion moderne avec support Google OAuth

### Dashboard Responsable SAV
Vue d'ensemble avec statistiques et graphiques

### Gestion des interventions
Liste et détails des interventions techniques

### Calendrier interactif
Planning des rendez-vous et interventions

</details>

---

## 🏗 Architecture

Le projet suit une **architecture microservices** avec un **API Gateway** (Ocelot) comme point d'entrée unique.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React + TypeScript)                       │
│                              http://localhost:5173                               │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            API GATEWAY (Ocelot)                                  │
│                           https://localhost:5000                                 │
│                    • Routing • JWT Auth • Rate Limiting                          │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │
        ┌───────────┬───────────┬───────┴───────┬───────────┬───────────┐
        │           │           │               │           │           │
        ▼           ▼           ▼               ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│    Auth     │ │   Clients   │ │Interventions│ │  Articles   │ │  Payments   │
│    5001     │ │    5002     │ │    5003     │ │    5004     │ │    5005     │
├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤
│• JWT/OAuth  │ │• Clients    │ │• Interv.    │ │• Catalogue  │ │• Stripe     │
│• Google SSO │ │• Réclam.    │ │• Techniciens│ │• Catégories │ │• Factures   │
│• Refresh    │ │• Achats     │ │• Évaluations│ │• Stock      │ │• Webhooks   │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
                                        │
        ┌───────────────────────────────┴───────────────────────────────┐
        │                                                               │
        ▼                                                               ▼
┌─────────────────────────┐                             ┌─────────────────────────┐
│     Notifications       │                             │       Messaging         │
│         5006            │                             │         5007            │
├─────────────────────────┤                             ├─────────────────────────┤
│ • SignalR Hub           │                             │ • SignalR Hub           │
│ • Push Notifications    │                             │ • Real-time Chat        │
│ • Email Alerts          │                             │ • Conversations         │
└─────────────────────────┘                             └─────────────────────────┘
                                        │
                                        ▼
                            ┌─────────────────────────┐
                            │      SQL Server         │
                            │    (8 Databases)        │
                            └─────────────────────────┘
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
| Google OAuth | 2.0 | Connexion sociale |
| SignalR | 8.0 | Communication temps réel |
| Stripe.NET | - | Paiements |
| Serilog | 8.0 | Logging |
| Swagger/OpenAPI | 6.5 | Documentation API |

### Frontend
| Technologie | Version | Description |
|------------|---------|-------------|
| React | 18.2 | Framework UI |
| TypeScript | 5.2 | Typage statique |
| Vite | 5.0 | Build tool |
| TanStack Query | 5.12 | Data fetching & caching |
| React Router | 6.20 | Routing |
| Zustand | 4.4 | State management |
| React Hook Form | 7.48 | Formulaires |
| Tailwind CSS | 3.3 | Styling |
| Recharts | 2.10 | Graphiques |
| date-fns | 2.30 | Manipulation des dates |
| @microsoft/signalr | 8.0 | Client SignalR temps réel |
| Heroicons | 2.2 | Icônes |
| React Toastify | 9.1 | Notifications toast |

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

### 6. Notifications Service (Port 5006)
Gère les notifications en temps réel via SignalR.

**Fonctionnalités :**
- Hub SignalR pour push notifications
- Notifications par type (réclamation, intervention, paiement)
- Historique des notifications
- Marquage lu/non-lu

**Endpoints :**
- `GET /api/notifications` - Liste des notifications
- `PUT /api/notifications/{id}/read` - Marquer comme lu
- **Hub SignalR :** `wss://localhost:5006/hubs/notifications`

### 7. Messaging Service (Port 5007)
Gère la messagerie instantanée entre utilisateurs.

**Fonctionnalités :**
- Chat en temps réel via SignalR
- Conversations liées aux réclamations/interventions
- Historique des messages

**Endpoints :**
- `GET /api/conversations` - Liste des conversations
- `GET/POST /api/messages` - CRUD messages
- **Hub SignalR :** `wss://localhost:5007/hubs/messaging`

### 8. API Gateway (Port 5000)
Point d'entrée unique utilisant Ocelot.

**Fonctionnalités :**
- Routage des requêtes vers les microservices
- Authentification JWT centralisée
- Rate limiting
- Load balancing
- CORS configuration

---

## ✨ Fonctionnalités

### 👤 Client
- ✅ Inscription et connexion (Email + Google OAuth)
- ✅ Création et gestion du profil
- ✅ Consultation des articles achetés
- ✅ Création de réclamations
- ✅ Suivi des réclamations en temps réel
- ✅ Demande de rendez-vous
- ✅ Évaluation des interventions
- ✅ Paiement en ligne (Stripe)
- ✅ Calendrier personnel interactif
- ✅ Notifications en temps réel
- ✅ Messagerie avec le support

### 👨‍🔧 Technicien
- ✅ Tableau de bord personnalisé
- ✅ Liste des interventions assignées
- ✅ Mise à jour du statut des interventions
- ✅ Calendrier des interventions
- ✅ Gestion de la disponibilité
- ✅ Notifications en temps réel
- ✅ Messagerie

### 👨‍💼 Responsable SAV
- ✅ Tableau de bord analytique avec graphiques
- ✅ Gestion complète des clients
- ✅ Gestion des réclamations
- ✅ Création et assignation d'interventions
- ✅ Gestion des techniciens
- ✅ Gestion des articles et catégories
- ✅ Gestion du stock (pièces détachées)
- ✅ Gestion des rendez-vous
- ✅ Visualisation des évaluations
- ✅ Export de données (Excel, CSV)
- ✅ Statistiques et rapports détaillés
- ✅ Gestion des paiements
- ✅ Notifications en temps réel
- ✅ Messagerie avec clients et techniciens

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
    "Key": "VotreCleSecreteJWTAvecAuMoins32Caracteres",
    "Issuer": "SAV.Auth.API",
    "Audience": "SAV.MicroServices"
  }
}
```

### Configuration Google OAuth

```json
{
  "Google": {
    "ClientId": "your-google-client-id.apps.googleusercontent.com",
    "ClientSecret": "your-google-client-secret"
  }
}
```

**Frontend (.env) :**
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
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

### Configuration des URLs de Services

```json
{
  "ServiceUrls": {
    "Auth": "https://localhost:5001",
    "Notifications": "https://localhost:5006",
    "Messaging": "https://localhost:5007"
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
6. Notifications API (5006)
7. Messaging API (5007)
8. Gateway (5000)

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

# Terminal 6 - Notifications Service
cd src/Services/Notifications/SAV.Notifications.API
dotnet run

# Terminal 7 - Messaging Service
cd src/Services/Messaging/SAV.Messaging.API
dotnet run

# Terminal 8 - Gateway
cd src/Gateway/SAV.Gateway
dotnet run
```

### Démarrage du Frontend

```bash
cd frontend
npm run dev
```

Le frontend sera accessible sur `http://localhost:5173`

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
| Notifications | https://localhost:5006/swagger |
| Messaging | https://localhost:5007/swagger |

### Via Gateway (Production)

Toutes les requêtes passent par le Gateway : `https://localhost:5000/api/...`

---

## ⚡ Temps Réel (SignalR)

L'application utilise SignalR pour les fonctionnalités temps réel.

### Hubs disponibles

| Hub | URL | Description |
|-----|-----|-------------|
| Notifications | `wss://localhost:5006/hubs/notifications` | Push notifications |
| Messaging | `wss://localhost:5007/hubs/messaging` | Chat en temps réel |

### Connexion côté client

```typescript
import { HubConnectionBuilder } from '@microsoft/signalr';

const connection = new HubConnectionBuilder()
  .withUrl('https://localhost:5006/hubs/notifications', {
    accessTokenFactory: () => authToken
  })
  .withAutomaticReconnect()
  .build();

connection.on('ReceiveNotification', (notification) => {
  console.log('Nouvelle notification:', notification);
});

await connection.start();
```

---

## 🔔 Notifications

### Types de notifications

| Type | Description | Destinataire |
|------|-------------|--------------|
| `ReclamationCreee` | Nouvelle réclamation créée | Client |
| `ReclamationMiseAJour` | Statut réclamation mis à jour | Client |
| `ReclamationResolue` | Réclamation résolue | Client |
| `ReclamationRejetee` | Réclamation rejetée | Client |
| `InterventionPlanifiee` | Intervention assignée | Technicien, Client |
| `InterventionEnCours` | Intervention démarrée | Technicien, Client |
| `InterventionTerminee` | Intervention terminée | Technicien, Client |
| `InterventionAnnulee` | Intervention annulée | Technicien, Client |
| `NouvelleEvaluation` | Évaluation reçue | Technicien |
| `RdvPlanifie` | RDV planifié | Client |
| `RdvConfirme` | RDV confirmé | Client |
| `RdvAnnule` | RDV annulé | Client |
| `PaiementRecu` | Paiement réussi | Client |
| `PaiementEchoue` | Paiement échoué | Client |
| `NouveauMessage` | Nouveau message reçu | Client, Technicien |
| `Systeme` | Notification système | Tous |

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
| Recevoir notifications | ✅ | ✅ | ✅ |
| Messagerie | ✅ | ✅ | ✅ |

---

## 📊 Statuts

### Statuts Réclamation
| Statut | Description | Couleur |
|--------|-------------|---------|
| `EnAttente` | Nouvelle réclamation, en attente de traitement | 🟡 Jaune |
| `EnCours` | Réclamation en cours de traitement | 🔵 Bleu |
| `Resolue` | Réclamation résolue avec succès | 🟢 Vert |
| `Rejetee` | Réclamation rejetée | 🔴 Rouge |

### Statuts Intervention
| Statut | Description | Couleur |
|--------|-------------|---------|
| `Planifiee` | Intervention planifiée | 🟡 Jaune |
| `EnCours` | Intervention en cours d'exécution | 🔵 Bleu |
| `Terminee` | Intervention terminée | 🟢 Vert |
| `Annulee` | Intervention annulée | 🔴 Rouge |

### Statuts RDV
| Statut | Description |
|--------|-------------|
| `EnAttente` | RDV en attente de confirmation |
| `Confirme` | RDV confirmé |
| `Annule` | RDV annulé |
| `Termine` | RDV passé |

---

## 🧪 Tests

```bash
# Lancer les tests unitaires (.NET)
dotnet test

# Lancer ESLint sur le frontend
cd frontend
npm run lint

# Vérifier les types TypeScript
cd frontend
npm run type-check
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. **Fork** le projet
2. Créez votre branche de fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Poussez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une **Pull Request**

### Guidelines

- Suivre les conventions de nommage existantes
- Écrire des tests pour les nouvelles fonctionnalités
- Documenter les changements importants
- S'assurer que tous les tests passent

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👨‍💻 Auteur

**Développé avec ❤️ par [A-Hamdi1](https://github.com/A-Hamdi1)**

Pour l'apprentissage de l'architecture microservices avec .NET et React.

---

<p align="center">
  <sub>⭐ Si ce projet vous a été utile, n'hésitez pas à lui donner une étoile !</sub>
</p>
