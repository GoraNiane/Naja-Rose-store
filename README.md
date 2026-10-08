# 🛍️ NAJA STORE — Plateforme E-Commerce de Luxe (Sénégal & Afrique de l'Ouest)

Architecture e-commerce haute couture et prêt-à-porter de prestige, modulaire, sécurisée et optimisée pour le marché sénégalais (Dakar, Banlieue, Régions), avec intégration native **Wave**, **Orange Money**, **Paiement à la Livraison**, gestion de stock en temps réel, facturation PDF et dashboard analytique.

---

## 📑 Sommaire

1. [Architecture Globale & Technologies](#1-architecture-globale--technologies)
2. [Installation & Prérequis](#2-installation--prérequis)
3. [Variables d'Environnement](#3-variables-denvironnement)
4. [Base de Données PostgreSQL & Neon](#4-base-de-données-postgresql--neon)
5. [Prisma ORM, Migrations & Schéma](#5-prisma-orm-migrations--schéma)
6. [Seed & Données de Démonstration](#6-seed--données-de-démonstration)
7. [Cloudinary & Gestion des Médias (Max 7 photos)](#7-cloudinary--gestion-des-médias-max-7-photos)
8. [Lancement & Utilisation du Backend](#8-lancement--utilisation-du-backend)
9. [Lancement & Utilisation du Frontend](#9-lancement--utilisation-du-frontend)
10. [Intégration Passerelle Wave Sénégal](#10-intégration-passerelle-wave-sénégal)
11. [Intégration Passerelle Orange Money Sénégal](#11-intégration-passerelle-orange-money-sénégal)
12. [Déploiement en Production (Vercel, Node, Neon, Cloudinary)](#12-déploiement-en-production)
13. [Sécurité, Idempotence & Tests Automatisés](#13-sécurité-idempotence--tests-automatisés)

---

## 1. Architecture Globale & Technologies

```text
naja-store/
├── backend/                  # API REST Express + TypeScript + Prisma ORM
│   ├── prisma/
│   │   ├── schema.prisma     # Schéma PostgreSQL (Decimal, Enums, Index, Contraintes)
│   │   └── seed.ts           # Données initiales réalistes (Dakar, Bazin, CFA)
│   ├── src/
│   │   ├── config/           # Variables d'environnement & Prisma Client singleton
│   │   ├── controllers/      # Contrôleurs HTTP (Auth, Produits, Commandes, Paiements...)
│   │   ├── middleware/       # Auth (JWT/RBAC), Validation Zod, Rate Limiting, Error Handler
│   │   ├── providers/        # Abstraction PaymentProvider (Wave, OM, COD) & Cloudinary
│   │   ├── repositories/     # Couche d'accès aux données Prisma
│   │   ├── routes/           # Endpoints d'API v1 (/auth, /products, /orders, /payments...)
│   │   ├── services/         # Logique métier (Stock, Facturation PDF, Analytics, Paiements)
│   │   ├── tests/            # Suites de tests automatisés (Unit, Intégration, Audit)
│   │   ├── validators/       # Schémas de validation Zod stricts
│   │   ├── app.ts            # Configuration Express, Helmet, CORS, RawBody HMAC
│   │   └── server.ts         # Démarrage & Arrêt gracieux (Graceful Shutdown)
│   ├── .env.example          # Modèle des variables d'environnement backend
│   └── package.json
│
├── frontend/                 # Application React 18 + Vite + TypeScript + Tailwind CSS
│   ├── public/               # Favicon, robots.txt, sitemap.xml
│   ├── src/
│   │   ├── components/       # UI & composants réutilisables (Navbar, Footer, Modales...)
│   │   ├── layouts/          # Layouts (MainLayout, AdminLayout)
│   │   ├── lib/              # Utilitaires (Formatage FCFA, Constants Dakar)
│   │   ├── pages/            # Pages Storefront, Checkout, Tracking, Admin Dashboard
│   │   ├── services/         # Clients API Axios (Auth, Produits, Commandes, Paiements)
│   │   ├── stores/           # Zustand Stores (Panier persistant, Auth)
│   │   ├── App.tsx           # Routage React Router v6 & React Query Provider
│   │   └── main.tsx          # Point d'entrée
│   ├── tailwind.config.js    # Palette de couleurs exclusive & typographie
│   └── package.json
│
├── .env.example              # Variables d'environnement globales
├── .gitignore                # Protection des secrets et fichiers générés
└── README.md
```

### Stack Technique :
* **Backend** : Node.js, TypeScript, Express.js, Prisma ORM, PostgreSQL, Zod, JWT, bcryptjs, Helmet, PDFKit, Winston/Logger.
* **Frontend** : React 18, TypeScript, Vite, Tailwind CSS, TanStack React Query, React Hook Form, Zustand, Lucide Icons.
* **Passerelles & Médias** : Wave Sénégal v1, Orange Money WebPay v1, Cloudinary SDK.

---

## 2. Installation & Prérequis

* **Node.js** : version 18.x ou 20.x LTS.
* **PostgreSQL** : version 14, 15, ou 16 (ou instance Neon Serverless).
* **Gestionnaire de paquets** : `npm` (inclus avec Node.js).

### Cloner et installer :
```bash
git clone https://github.com/votre-compte/naja-store.git
cd naja-store

# Installation backend
cd backend
npm install

# Installation frontend
cd ../frontend
npm install
```

---

## 3. Variables d'Environnement

Dupliquer les fichiers `.env.example` :
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

### Configuration de `backend/.env` :
```env
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:5173
API_URL=http://localhost:5000/api/v1

# Base de données PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/naja_store?schema=public

# Sécurité & JWT (Minimum 32 caractères aléatoires)
JWT_SECRET=naja_store_senegal_secure_dev_jwt_secret_key_32_characters_long
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Passerelle Wave Sénégal
WAVE_API_KEY=your_wave_api_key
WAVE_SECRET=your_wave_secret_key
WAVE_BUSINESS_ID=your_wave_business_id
WAVE_WEBHOOK_SECRET=your_wave_webhook_secret

# Passerelle Orange Money Sénégal
ORANGE_MONEY_CLIENT_ID=your_orange_money_client_id
ORANGE_MONEY_CLIENT_SECRET=your_orange_money_client_secret
ORANGE_MONEY_MERCHANT_KEY=your_orange_money_merchant_key
ORANGE_MONEY_API_KEY=your_orange_money_api_key
ORANGE_MONEY_API_URL=https://api.orange.com/orange-money-webpay/dev/v1

# Localisation
DEFAULT_CURRENCY=XOF
COUNTRY_CODE=SN
STORE_NAME="NAJA STORE"
STORE_PHONE="+221770000000"
STORE_EMAIL="contact@najastore.sn"
```

> [!IMPORTANT]
> **Zero Secret dans React** : Le frontend ne contient aucun secret ni clé privée. Tout transit passe par l'API backend sécurisée.

---

## 4. Base de Données PostgreSQL & Neon

L'application est 100% compatible avec :
* Un serveur PostgreSQL local (`localhost:5432`).
* **Neon PostgreSQL Serverless** pour le cloud avec SSL requis :
  ```env
  DATABASE_URL="postgresql://neondb_owner:VOTRE_MOT_DE_PASSE@ep-cool-cloud-123456-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
  ```

---

## 5. Prisma ORM, Migrations & Schéma

Le schéma [`backend/prisma/schema.prisma`](file:///c:/naja%20store/backend/prisma/schema.prisma) intègre :
* Types `Decimal(10, 2)` pour les montants financiers en FCFA.
* Enums stricts : `Role`, `OrderStatus`, `PaymentStatus`, `PaymentMethod`, `StockMovementType`.
* Contraintes uniques d'intégrité : `@@unique([productId, colorId, sizeId])`, `orderNumber`, `invoiceNumber`, `sku`.
* Index optimisés sur les clés étrangères, slugs, emails et numéros de téléphone.

### Commandes Prisma :
```bash
cd backend

# Génération du client TypeScript
npm run prisma:generate

# Application des migrations en développement
npm run prisma:migrate

# Déploiement du schéma en production
npx prisma migrate deploy

# Visualisation interactive de la base
npm run prisma:studio
```

---

## 6. Seed & Données de Démonstration

Le seed peuple la base avec des données authentiques du marché dakarois :
* Catégories : *Bazin Riche Getzner*, *Soies & Dentelles*, *Maroquinerie de Luxe*, *Accessoires Prestige*.
* Articles avec jusqu'à 7 photos HD, tailles standard (*S, M, L, XL, XXL*), couleurs riches et inventaire.
* Zones de livraison réelles avec tarifs configurés :
  * *Dakar Plateau / Centre-Ville* — 2 000 FCFA
  * *Almadies / Ngor / Ouakam* — 2 000 FCFA
  * *Pikine / Guédiawaye (Banlieue)* — 2 500 FCFA
  * *Rufisque / Diamniadio* — 3 000 FCFA
  * *Régions (Thiès, Mbour, Saint-Louis, Touba)* — 5 000 FCFA

### Exécuter le seed :
```bash
cd backend
npm run prisma:seed
```

### Comptes de démonstration créés :
| Rôle | Email | Mot de passe |
| :--- | :--- | :--- |
| **Administrateur** | `admin@najastore.sn` | `AdminPass2026!` |
| **Client Test** | `fatou.diop@example.sn` | `CustomerPass2026!` |

---

## 7. Cloudinary & Gestion des Médias (Max 7 photos)

* **Règle absolue** : 7 photos maximum par produit.
* **Optimisations** : Redimensionnement automatique, format webp et compression auto (`q_auto,f_auto`).
* **Gestion admin** : Upload, réorganisation, désignation de la photo principale (`isPrimary`), et suppression sécurisée par `publicId`.

---

## 8. Lancement & Utilisation du Backend

```bash
cd backend

# Mode développement avec rechargement à chaud
npm run dev

# Compilation de production
npm run build

# Démarrage du serveur compilé
npm run start
```
* **URL de l'API** : `http://localhost:5000`
* **Vérification de santé (Health Check)** : `http://localhost:5000/api/v1/health`

---

## 9. Lancement & Utilisation du Frontend

```bash
cd frontend

# Mode développement Vite
npm run dev

# Compilation de production
npm run build

# Prévisualisation du bundle de production
npm run preview
```
* **Storefront client** : `http://localhost:5173`
* **Back-office Administrateur** : `http://localhost:5173/admin`

---

## 10. Intégration Passerelle Wave Sénégal

L'architecture supporte l'API Wave v1 officielle et le mode Sandbox :
* **Initiation** : `POST https://api.wave.com/v1/checkout/sessions` avec `client_reference` (numéro de commande) et redirection vers `wave_launch_url`.
* **Webhook** : `POST /api/payments/wave/webhook`.
* **Vérification de signature** : Valide l'en-tête `wave-signature` via HMAC-SHA256 contre `WAVE_WEBHOOK_SECRET`.
* **Idempotence** : Évite les doubles traitements si la commande est déjà marquée `PAID`.

---

## 11. Intégration Passerelle Orange Money Sénégal

L'architecture intègre le flux officiel Orange Money WebPay :
* **Authentification** : Échange OAuth2 client credentials (`POST https://api.orange.com/oauth/v3/token`).
* **Initiation WebPay** : `POST ${ORANGE_MONEY_API_URL}/webpayment` avec devise `OUV` (XOF), `order_id`, et `notif_url`.
* **Webhook de notification** : `POST /api/payments/orange-money/webhook`.
* **Vérification de statut** : Interrogation automatique par token ou confirmation webhook.

---

## 12. Déploiement en Production

### A. Base de données $\rightarrow$ Neon PostgreSQL
1. Créer un projet sur [neon.tech](https://neon.tech).
2. Récupérer la chaîne de connexion avec `sslmode=require`.
3. Définir `DATABASE_URL` dans les variables d'environnement de l'hébergeur.
4. Exécuter `npx prisma migrate deploy` pour initialiser le schéma.

### B. Backend $\rightarrow$ Hébergeur Node.js (Render, Railway, Fly.io, VPS)
1. Définir les variables d'environnement (`NODE_ENV=production`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `APP_URL`, `API_URL`, etc.).
2. Commande de build : `npm install && npm run build`.
3. Commande de démarrage : `npm run start`.
4. Configurer les règles CORS avec le domaine frontend exact.

### C. Frontend $\rightarrow$ Vercel / Netlify
1. Connecter le dépôt Git et sélectionner le sous-dossier `frontend`.
2. Framework Preset : **Vite**.
3. Build Command : `npm run build`.
4. Output Directory : `dist`.
5. Variable d'environnement : `VITE_API_URL=https://api.votredomaine.sn/api/v1`.

---

## 13. Sécurité, Idempotence & Tests Automatisés

### Mesures de Sécurité Appliquées :
* **Protection HTTP** : En-têtes `Helmet`, restriction CORS par origine, rate-limiting (`express-rate-limit`).
* **Validation des Entrées** : 100% des payloads validés par schémas `Zod` (aucune donnée brute frontend n'est injectée).
* **Transactions Prisma** : Décrémentation de stock, création de commande, paiement et factures atomiques dans `prisma.$transaction`.
* **Gestion du Stock** : Rejet automatique si stock insuffisant, réintégration automatique en cas d'annulation de commande.
* **Audit Logs** : Traçabilité des commandes, paiements et actions administratives.

### Exécuter la Suite de Tests :
```bash
cd backend

# Suite complète de vérification & audit de sécurité
npm test
```
* **Résultats des tests** : 100% des tests validés (Wave, Orange Money, COD, HMAC, Factures PDF, Numérotation de commande, Recalcul serveur de livraison).

---

## 👑 NAJA STORE — Dakar, Sénégal
*L'Élégance et la Haute Couture Africaine à portée de clic.*
