# Ozerus Design System — Web Components (Stencil)

Design system de l'extranet Ozerus, livré sous forme de web components framework-agnostiques (Stencil 4). Tokens, 9 primitives et 5 patterns prêts à être consommés depuis n'importe quelle app (Angular, React, Vue, vanilla).

## Prérequis

- Node 18+
- npm

## Démarrage

```bash
npm install
npm start
```

Le dev server Stencil démarre sur `http://localhost:3333` et charge le showcase (`src/index.html`) avec hot-reload.

## Build

```bash
npm run build
```

Produit :
- `dist/` — bundle `esm` + loader + types
- `loader/` — entry ESM pour `defineCustomElements()`
- `www/` — showcase statique

## Consommation

### Vanilla HTML

```html
<!-- IMPORTANT : les deux lignes sont nécessaires -->
<link rel="stylesheet" href="node_modules/ozerus-ds/dist/ozerus-ds/ozerus-ds.css" />
<script type="module" src="node_modules/ozerus-ds/dist/ozerus-ds/ozerus-ds.esm.js"></script>

<oz-button variant="primary">Action</oz-button>
```

### Angular / React / Vue

```ts
import { defineCustomElements } from 'ozerus-ds/loader';
import 'ozerus-ds/dist/ozerus-ds/ozerus-ds.css'; // tokens — indispensable
defineCustomElements();
```

Puis utiliser les tags `<oz-*>` dans les templates. Pour React, générer les wrappers via un output target `react` (non activé par défaut).

### Tokens

Les tokens (`--oz-forest`, `--oz-s-4`, `--oz-sh-2`, `@import` Google Fonts…) vivent dans `dist/ozerus-ds/ozerus-ds.css`. **Cette feuille doit être chargée dans le document** — Stencil ne l'injecte pas automatiquement. Sans elle, les custom properties ne sont pas définies sur `:root` et ni le shadow DOM des composants ni les styles applicatifs qui utilisent `var(--oz-*)` ne se résolvent.

Polices (Familjen Grotesk, JetBrains Mono) chargées via `@import` Google Fonts en tête de ce même fichier.

## Composants

### Primitives

- `oz-button` — `variant`, `size`, `disabled` · slots `leading`, `trailing`, default
- `oz-input` — `label`, `placeholder`, `value`, `hint`, `error`, `size`, `type` · events `ozInput`, `ozChange` · slots `leading`, `trailing`
- `oz-tag` — `tone`, `variant` · slots `leading`, default
- `oz-avatar` — `name`, `size`, `tone`
- `oz-icon` — `name`, `size`, `color`, `stroke-width` (22 glyphs)
- `oz-kpi` — `label`, `value`, `unit`, `delta`, `delta-tone`, `sub` · slot `chart`
- `oz-sparkline` — `data` (array ou JSON string), `w`, `h`, `color`
- `oz-line-chart` — `series`, `y-labels`, `w`, `h`
- `oz-swatch` — showcase helper (`name`, `value`, `label`, `fg`, `w`, `h`)

### Patterns

- `oz-product-table` — `rows`, `compact`
- `oz-sidebar` — `active`, `user`, `org`
- `oz-header` — `heading`, `search-placeholder`, `notification-count` · slot `actions`
- `oz-event-row` — `date-month`, `date-day`, `kind`, `product`, `amount`, `tone`
- `oz-empty-state` — `icon`, `heading`, `body` · slot `action`

## Props complexes (tableaux / objets)

Les props `data` (`oz-sparkline`), `series` / `y-labels` (`oz-line-chart`) et `rows` (`oz-product-table`) acceptent :

- **Propriété JS** (recommandé) : `el.data = [1, 2, 3]`
- **Attribut JSON** : `<oz-sparkline data='[1,2,3]'>`

## Structure

```
src/
├── global/tokens.css     — tokens + polices
├── index.html            — showcase
└── components/
    ├── oz-button/
    ├── oz-input/
    ├── oz-tag/
    ├── oz-avatar/
    ├── oz-icon/
    ├── oz-kpi/
    ├── oz-sparkline/
    ├── oz-line-chart/
    ├── oz-swatch/
    ├── oz-product-table/
    ├── oz-sidebar/
    ├── oz-header/
    ├── oz-event-row/
    └── oz-empty-state/
```
