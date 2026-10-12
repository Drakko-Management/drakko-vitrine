# Drakko — Vitrine (`04-vitrine`)

Site teaser de `drakko.fr` : une page unique qui présente Drakko et recueille une liste d'attente (ADR-020). Astro (pages statiques, peu de JavaScript), GSAP pour le récit de chantier, TypeScript. Déployé sur Vercel. Il n'appelle l'API (`03-back`, dépôt `drakko-backend`) que pour la liste d'attente.

Les textes viennent de `01-docs/11-teaser-content.md` (dépôt `drakko-docs`), les choix de fond de l'ADR-020 dans `01-docs/08-decisions.md`.

## Commandes
Node ≥ 22.12.

- `npm install`
- `npm run dev` : site local sur http://localhost:4321. L'API est cherchée sur `http://localhost:3100` sauf si `PUBLIC_API_URL` est définie.
- `npm run check` : **à lancer avant de pousser** (types, tests, build). Le build exige `PUBLIC_API_URL` : `PUBLIC_API_URL=http://localhost:3100 npm run check`.
- `npm test` · `npm run typecheck` · `npm run build` · `npm run preview`

## Variables d'environnement
Toutes sont **publiques** : elles sont lues au moment du build et se retrouvent dans la page. Aucun secret ici, jamais (le dépôt est public). Changer une valeur demande un nouveau déploiement, et l'adresse de l'API est aussi inscrite dans la politique de sécurité du contenu (`src/layouts/Base.astro`).

| Variable | Rôle |
|---|---|
| `PUBLIC_API_URL` | Adresse de l'API, sans `/` final. **Obligatoire** pour un build publié (le build échoue sinon). |
| `PUBLIC_TURNSTILE_SITE_KEY` | Clé de **site** Cloudflare Turnstile (la clé secrète est dans le back : `TURNSTILE_SECRET_KEY`). Facultative en développement. |
| `PUBLIC_SITE_URL` | Adresse publique du site (adresses canoniques, image de partage). Par défaut `https://drakko.fr`. |
| `PUBLIC_INDEXABLE` | `true` en production seulement. Sinon la page demande aux moteurs de recherche de l'ignorer (`noindex, nofollow`). |

Essayer Turnstile en local : la clé de site de test `1x00000000000000000000AA` réussit toujours (la clé secrète de test correspondante, `1x0000000000000000000000000000000AA`, va dans le `.env` du back).

## Déploiement (Vercel, projet `drakko-vitrine`)
- `main` → production, `develop` → pré-production (adresse d'aperçu de la branche, affichée dans Vercel). On travaille et on pousse sur `develop` ; `main` n'avance que sur demande.
- Les variables se règlent par environnement dans *Settings → Environment Variables* : **Production** pour `main`, **Preview** pour `develop`. La pré-production pointe sur l'API de pré-production.
- Côté back (Railway, par environnement) : `VITRINE_URL` doit être l'origine exacte de la vitrine de cet environnement (CORS de `/waitlist` et liens des emails), et `TURNSTILE_SECRET_KEY` la clé secrète du site Turnstile correspondant. Le site Turnstile doit lister le domaine de la vitrine dans ses noms d'hôte, sinon le widget refuse de s'afficher.
- Sans ces deux variables du back, `/waitlist` répond `503` : la liste d'attente est fermée.

## Structure
- `src/pages/` : accueil, confirmation de l'adresse, désinscription, mentions légales, confidentialité, 404.
- `src/components/`, `src/layouts/` : sections de la page et gabarits (`Base.astro` porte la politique de sécurité du contenu).
- `src/lib/` : client de l'API (`waitlist-api.ts`), Turnstile (chargé au premier geste dans le formulaire), jeton de l'email (`token.ts`, lu dans le fragment `#token=` de l'adresse, jamais envoyé au serveur web).
- `src/scripts/` : JavaScript du navigateur. Aucun script ni style en ligne : la page n'en a pas besoin.
- `public/brand/` : logos en WebP, produits par `scripts/prepare-logos.mjs` à partir de `02-front/public/drakko` (il faut le dépôt `drakko-frontend` à côté de celui-ci). À relancer seulement si le logo change.

## Git
Conventional Commits en français (`feat(vitrine): …`), le corps explique le pourquoi. Ne jamais commiter `dist/`, `.astro/`, `node_modules/` ni de fichier `.env*` (le `.gitignore` les exclut).
