# Ozerus — apps

Deux apps qui consomment la lib `ozerus-ds` (au-dessus) :

- `apps/api` — **NestJS** sur `:4000`, data mock in-memory, JWT
- `apps/web` — **Next.js 14 App Router** sur `:3000`

## Démarrage

Trois terminaux (ou trois onglets).

### 1. Design system — build initial

```bash
# à la racine du repo (poc-ozerus/)
npm install
npm run build    # génère dist/ consommé par apps/web via file:
```

### 2. API

```bash
cd apps/api
npm install
npm run dev      # http://localhost:4000/api
```

### 3. Web

```bash
cd apps/web
npm install
npm run dev      # http://localhost:3000
```

## Compte de démo

- Email : n'importe quel email valide (ex. `marie.laurent@helios.fr`)
- Mot de passe : n'importe quoi ≥ 4 caractères
- Code MFA : **`123456`**

Emails "connus" qui mappent sur un user mock (rôle + cabinet) :

| email | rôle | cabinet |
|---|---|---|
| marie.laurent@helios.fr | partner | Cabinet Helios |
| pierre.dubois@helios.fr | partner | Cabinet Helios |
| admin@ozerus.fr | admin | Ozerus |

Tout autre email crée un utilisateur volatile (Cabinet POC, partner).

## Routes

### API

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Étape 1 : credentials → challengeId |
| POST | `/api/auth/login/mfa` | — | Étape 2 : code MFA → JWT |
| GET | `/api/auth/me` | JWT | Profil de l'utilisateur courant |
| POST | `/api/auth/logout` | JWT | No-op (le client supprime le cookie) |
| GET | `/api/dashboard/kpis` | JWT | 4 KPI (encours, produits, clients, coupon) |
| GET | `/api/dashboard/chart` | JWT | Séries temporelles 12 mois |
| GET | `/api/products?q=` | JWT | Liste produits (filtre plein-texte) |
| GET | `/api/products/:isin` | JWT | Détail produit |
| GET | `/api/events` | JWT | Timeline événements |
| GET | `/api/reports` | JWT | Liste reportings |
| GET | `/api/reports/:id` | JWT | Détail reporting |
| POST | `/api/reports` | JWT | Création reporting (pending → ready après 2s) |
| GET | `/api/portfolio` | JWT | Résumé portefeuille + positions |
| GET | `/api/users` | JWT | Liste utilisateurs |

### Web

| Route | Description |
|---|---|
| `/` | Redirige vers `/login` ou `/dashboard` |
| `/login` | Flow deux étapes (credentials + MFA) |
| `/dashboard` | KPIs, line chart, produits, événements |
| `/products` | Liste + recherche, click → détail |
| `/products/:isin` | Fiche produit + documents |
| `/reports` | Liste des reportings |
| `/reports/new` | Formulaire de création |
| `/portfolio` | Encours + positions clients |
| `/users` | Utilisateurs du cabinet |

Middleware Next redirige `/dashboard`, `/products`, `/reports`, `/portfolio`, `/users` vers `/login` si pas de cookie `oz_token`. Inversement, `/login` avec cookie valide → `/dashboard`.

## Architecture

```
poc-ozerus/
├── src/                          # Ozerus Design System (Stencil)
├── dist/                         # Build DS (dist/loader + dist/ozerus-ds)
├── apps/
│   ├── api/                      # NestJS
│   │   └── src/
│   │       ├── main.ts           # bootstrap + CORS + global prefix /api
│   │       ├── app.module.ts
│   │       ├── auth/             # JWT, MFA in-memory, guard
│   │       ├── dashboard/
│   │       ├── products/
│   │       ├── events/
│   │       ├── reports/          # état pending → ready (setTimeout mock)
│   │       ├── portfolio/
│   │       ├── users/
│   │       └── mock/             # données mémoire (produits, events)
│   └── web/                      # Next.js 14
│       └── src/
│           ├── middleware.ts     # garde les routes protégées
│           ├── types/oz-elements.d.ts  # tags oz-* typés en JSX
│           ├── components/ds-loader.tsx # defineCustomElements client-side
│           ├── lib/{auth,api}.ts
│           └── app/
│               ├── layout.tsx
│               ├── globals.css   # tokens Ozerus (miroir de tokens.css DS)
│               ├── login/
│               ├── actions/auth.ts  # server actions login/mfa/logout
│               └── (app)/
│                   ├── layout.tsx     # auth guard + shell
│                   ├── app-shell.tsx  # sidebar + header
│                   ├── dashboard/
│                   ├── products/ + [isin]/
│                   ├── reports/ + new/
│                   ├── portfolio/
│                   └── users/
```

## Auth flow (résumé)

```
POST /api/auth/login {email, password}
     ↓ { challengeId, hint }
POST /api/auth/login/mfa {challengeId, code}
     ↓ { token, user }                        ← Next stocke dans cookie httpOnly `oz_token`
GET /api/auth/me           (Bearer token)     ← côté Next, used by (app)/layout pour protéger
```

Tous les fetchs côté serveur Next passent par `apiFetch()` qui lit automatiquement le token depuis le cookie (`readToken()` dans `lib/auth.ts`).

## Limites connues du POC

- Auth **en mémoire** : tous les utilisateurs, challenges MFA et reports sont perdus au restart de l'API.
- Pas de refresh token : la session expire au bout de 12h.
- Pas de RBAC réel : `role` retourné mais pas utilisé pour filtrer les routes.
- Portfolio & Users sont minimalistes (pas de pagination, pas de détail client).
- Les reports "générés" ne produisent pas de vrai PDF, juste un changement de statut.
