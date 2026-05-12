# ATIS·EU — D-ATIS Europe

Service web pour pilotes européens : agrégation des D-ATIS reçus via ACARS, avec une UX pensée pour l'usage cockpit / pré-vol.

## Stack

- **Next.js 16** (App Router, TypeScript strict)
- **Tailwind CSS v4**
- **shadcn/ui** (composants de base)
- **Lucide React** (icônes)
- **Fonts** : Inter (UI) + JetBrains Mono (données aéro)

## Lancer le projet

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000

## Structure

```
src/
  app/
    page.tsx              # Home — recherche ICAO
    atis/[icao]/page.tsx  # Page résultat ATIS (à venir)
    legal/page.tsx        # Mentions légales (à venir)
    layout.tsx            # Root layout (dark mode, fonts)
    globals.css           # Palette custom + Tailwind config
  components/             # Composants réutilisables (à venir)
  lib/                    # Types, store, mock data, parsers (à venir)
```

## Phase actuelle

**Phase 1** — Front-end avec données mockées. Pas de backend, pas d'auth.
Voir `brief.md` pour le cahier des charges complet.
