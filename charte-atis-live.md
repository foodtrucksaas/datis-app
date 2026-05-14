# ATIS.live — Charte graphique

> Identité visuelle complète. À utiliser pour le produit, le site marketing,
> les réseaux sociaux, les emails transactionnels, et toute communication
> publique. Cohérence non-négociable.

---

## 1. Positionnement de marque

**Une phrase** : Le briefing D-ATIS européen, en temps réel, pour les
pilotes de ligne.

**Promesse** : Précision, instantanéité, lisibilité cockpit.

**Personnalité** : Sobre, technique, confiante. Ni marketing, ni
familière. Pense ATC, pas SaaS.

**Public cible** : Pilotes professionnels européens (compagnies majeures
et low-cost). Dispatchers et OCC en cible secondaire.

**Inspirations** : ForeFlight, Garmin Pilot, Linear, Vercel, Bell & Ross,
glass cockpit moderne.

---

## 2. Nom et écriture

Le nom officiel s'écrit **`ATIS.live`** :
- `ATIS` en capitales
- `.` point discret mais présent
- `live` en minuscules

**Variantes autorisées** :
- Logo grande taille (titres, accueil, marketing)
- Logo compact (header app, signatures email)
- Mark seul `A·L` (favicons, app icon, watermarks)

**Jamais** :
- `Atis Live` (deux mots)
- `ATIS LIVE` (tout en capitales)
- `atislive` (sans séparateur)
- `Atis.Live`, `ATIS.LIVE` ou autre cassure de capitalisation

**Domaine** : `atis.live` (canonical)
**Sous-domaines** : `app.atis.live`, `api.atis.live`, `docs.atis.live`,
`status.atis.live`

---

## 3. Logo et wordmark

### Construction

Le wordmark est en **JetBrains Mono**, deux poids combinés :
- `ATIS` — JetBrains Mono 500 (Medium), blanc pur (#FFFFFF)
- `.` — JetBrains Mono 500, **couleur Signal (#F59E0B)**, padding latéral 3px
- `live` — JetBrains Mono 400 (Regular), gris secondaire (#8B98A8)

Letter-spacing : -0.02em sur `ATIS`, -0.01em sur `live`, pour la cohésion
visuelle.

JetBrains Mono est gratuit, sous licence OFL, téléchargeable sur
https://www.jetbrains.com/lp/mono/ ou via Google Fonts.

### Le point amber

Le point entre `ATIS` et `live` est l'élément signature de la marque. Il :
- est toujours en couleur Signal (#F59E0B)
- ne disparaît jamais
- peut pulser en animation discrète sur le web (2s loop, opacity 1 → 0.4)
- s'inspire des annunciators de cockpit Boeing — ces voyants ambrés qui
  signalent une information opérationnelle active
- symbolise la transmission ACARS en cours

### Tailles minimales

- Web : 14px de hauteur de cap (sinon illisible)
- Print : 8mm
- Favicon : utiliser la variante `A·L` à partir de 32px

### Espace de protection

Autour du wordmark, réserver un espace libre égal à la hauteur d'une
capitale. Aucun élément graphique dans cette zone.

### Variantes monochrome

- Sur fond sombre : ATIS blanc + point Signal + live gris (default)
- Sur fond clair : ATIS Void (#0A0E14) + point Signal + live gris
- Monochrome strict : ATIS noir/blanc + point identique + live moyen (sans Signal)
- Inverse négatif : à éviter, sauf cas marketing très exceptionnels

### Ce qu'on ne fait jamais

- Pas de stroke autour des lettres
- Pas de gradient sur le wordmark
- Pas de remplacement du point par un autre symbole (avion, etc.)
- Pas de version « décorative » avec ailes, hélice, ou autre cliché aviation
- Pas de fond coloré derrière le wordmark dans un logo composite
- Pas de version italique, condensed, ou avec effets

---

## 4. Palette de couleurs

### Couleurs structurelles

| Nom | Hex | Usage |
|---|---|---|
| **Void** | `#0A0E14` | Fond principal de l'app en dark mode |
| **Deck** | `#131820` | Surfaces cartes, panneaux |
| **Panel** | `#1A2029` | Cartes en avant-plan, tuiles internes |
| **Frame** | `#232B36` | Bordures, séparateurs (toujours 0.5px) |

### Couleur signature

| Nom | Hex | Usage |
|---|---|---|
| **Signal** | `#F59E0B` | Accent unique de la marque. Wordmark (point), liens, focus, états actifs, indicateur LIVE. Inspiré des annunciators cockpit Boeing. |
| **Signal-deep** | `#D97706` | Variante darken pour hover, secondary actions |
| **Signal-fade** | `rgba(245,158,11,0.12)` | Fond de badge, surfaces accent transparentes |

### Couleurs texte

| Nom | Hex | Usage |
|---|---|---|
| **Text-primary** | `#E6EDF3` | Texte principal sur fond sombre |
| **Text-secondary** | `#8B98A8` | Sous-titres, labels, métadonnées |
| **Text-muted** | `#5A6675` | Mentions discrètes, watermarks, infos secondaires |

### Couleurs sémantiques fraîcheur

| Nom | Hex | Quand l'utiliser |
|---|---|---|
| **Fresh** | `#4ADE80` | Données reçues < 30 min |
| **Warm** | `#FBBF24` | Données 30-60 min |
| **Stale** | `#F87171` | Données > 60 min |
| **Cold** | `#6B7280` | Données > 6h ou indisponibles |

### Light mode (jour, tarmac soleil)

| Rôle | Hex |
|---|---|
| Background | `#FAFAFA` |
| Surface | `#FFFFFF` |
| Surface elevated | `#F4F5F7` |
| Border | `#E4E7EC` |
| Text primary | `#0A0E14` |
| Text secondary | `#5A6675` |
| Text muted | `#8B98A8` |

Le **Signal reste #06B6D4** dans les deux modes. C'est la couleur de
marque, elle ne change jamais.

### Discipline

- **5 couleurs maximum à l'écran**. Si tu en utilises 6, tu en as une de
  trop.
- **Une seule couleur d'accent : Signal**. Pas d'orange marketing, pas de
  rose CTA, pas de violet brand secondary.
- **Aucun gradient nulle part**. Les surfaces sont plates.
- **Les couleurs sémantiques ne sont pas décoratives** : Fresh, Warm,
  Stale, Cold ont une fonction métier précise. Ne les utilise pas
  ailleurs.

---

## 5. Typographie

### Fontes

**Geist Sans** — Variable, par Vercel, gratuite, sous licence OFL.
- Source : https://vercel.com/font/sans
- Usage : tout texte UI, prose, titres
- Poids utilisés : 400 (Regular), 500 (Medium). Pas de 600+.

**JetBrains Mono** — Variable, par JetBrains, gratuite, sous licence OFL.
- Source : https://www.jetbrains.com/lp/mono/ ou Google Fonts
- Usage : **wordmark de marque** (signature visuelle non négociable),
  toute donnée aéro (ICAO, METAR, TAF, raw ATIS), labels de navigation
  type "1530Z", codes, identifiants
- Poids : 400 (Regular), 500 (Medium). Pas de 600+ dans le produit, sauf
  cas de poster/marketing très spécifique.

### Échelle typographique

| Rôle | Taille | Poids | Famille | Usage |
|---|---|---|---|---|
| Display | 56px / 1.0 | 500 | JetBrains Mono | Wordmark titre |
| Headline | 34px / 1.1 | 500 | JetBrains Mono | ICAO en header |
| H1 | 28px / 1.2 | 500 | Geist Sans | Titres de page |
| H2 | 22px / 1.3 | 500 | Geist Sans | Sections |
| H3 | 18px / 1.4 | 500 | Geist Sans | Sous-sections |
| Body | 15px / 1.5 | 400 | Geist Sans | Prose, paragraphes |
| Data | 18px / 1.4 | 500 | JetBrains Mono | Valeurs aéro (vent, QNH, visi) |
| Raw | 13px / 1.55 | 400 | JetBrains Mono | Blocs ATIS/METAR/TAF raw |
| Label | 11px / 1.2 | 500 | JetBrains Mono | Labels majuscules, tracking 0.08em |
| Caption | 11px / 1.4 | 400 | Geist Sans | Mentions discrètes, age de donnée |

### Règles d'écriture

- **Sentence case par défaut.** Pas de Title Case sur les titres de
  page, sauf cas exceptionnel (nom de marque dans un titre).
- **CAPITALES réservées aux labels techniques** : "ARRIVÉE", "DÉPART",
  "QNH", "RAW ATIS ARR". Avec letter-spacing 0.08em.
- **Toute donnée aéro en mono**. Aucune exception. C'est la convention
  pilote depuis 50 ans.
- **Temps UTC avec suffixe Z** : `1530Z`, pas `15:30 UTC`.
- **ICAO en capitales toujours** : `LFPG`, jamais `lfpg`.
- **Unités séparées de la valeur par espace insécable** : `12 kt`,
  `1018 hPa`, `FL060`. Sauf pour les degrés : `250°`.

---

## 6. Iconographie

### Bibliothèque

**Lucide React** (déjà en usage). Strict ligne, jamais filled. Stroke
width 1.5px par défaut, 2px pour les icônes de feedback fort.

### Tailles standard

| Contexte | Taille |
|---|---|
| Inline dans texte | 14px |
| Icône bouton | 16px |
| Icône standalone | 20px |
| Icône hero | 24px |

### Style

- Toujours en couleur Text-secondary par défaut
- Signal pour les états actifs
- Sémantique (Fresh, Warm, Stale) pour les indicateurs de fraîcheur
- Jamais de fond coloré derrière l'icône, sauf pour les badges de statut

### Icônes signature à utiliser de façon récurrente

- `Plane` (icône Lucide) — réservée à des contextes très spécifiques,
  jamais décorative
- `Radio` — pour les broadcasts ATIS voix
- `Wind` — barre vent forecast
- `AlertTriangle` — bannière disclaimer
- `RefreshCw` — bouton actualiser
- `Star` — favoris

**Ne pas utiliser** : avion stylisé en cliché (le rond avec une queue
qui dépasse), hélice, casque pilote, parachute. Trop générique et
amateur.

---

## 7. Composants visuels signature

### Badge LIVE

Pastille discrète en haut à droite de la home et des pages de détail,
quand la donnée est récente (<30 min) :

```
[• LIVE]   en couleur Signal, fond Signal-fade, mono 12px 500
```

Le point pulse à 2s d'intervalle. C'est l'élément qui fait vivre
l'identité.

### Pill fraîcheur

Sous la lettre ATIS et sur les blocs METAR/TAF, indique l'âge :

```
[• reçu il y a 12 min]   couleur selon Fresh/Warm/Stale/Cold
```

### Bannière disclaimer

Sur fond Warm-fade (`rgba(251,191,36,0.08)`) avec bordure Warm
(`rgba(251,191,36,0.2)`), icône AlertTriangle à gauche, texte court en
Warm. Persistante, cliquable pour rouvrir la modale complète.

### Card ATIS principale

Surface Deck, bordure Frame 0.5px, border-radius 14px. La lettre ATIS
centrée en énorme mono 60px+. Grid 2×2 des infos critiques en dessous,
chacune dans une tuile Panel.

---

## 8. Tone of voice

### Principes

- **Direct et factuel.** Comme un message ATC, pas comme une newsletter.
- **Précis dans le vocabulaire aéro.** UTC, kt, hPa, FL, ICAO. Jamais
  d'unités vulgarisées.
- **Confiance sans arrogance.** On sait ce qu'on fait, on n'en fait pas
  trois pages.
- **Brièveté.** Si on peut dire en 5 mots, on dit en 5 mots.
- **Zéro fluff marketing.** Pas de "révolutionnaire", "innovant",
  "incroyable". Pas d'emoji.

### Bilinguisme

- **Interface produit en français** quand l'utilisateur est en France ou
  a configuré FR. **En anglais** sinon. Les labels métier (ICAO, ATIS,
  METAR, TAF, QNH, RWY) restent toujours en anglais ou en abréviations
  standard, peu importe la langue UI.
- **Site marketing : EN par défaut**, FR en alternative. La cible pilote
  ligne est habituée à l'anglais.
- **Tweets et com publique : EN.** L'aviation se parle en anglais.

### Exemples

| ❌ À éviter | ✅ Préférer |
|---|---|
| « Découvrez le meilleur outil ATIS du marché ! » | « ATIS en temps réel, pour tous les terrains européens. » |
| « Wow, nouvel ATIS chez vous ! 🎉 » | « INFO B reçu à 1530Z. » |
| « Notre incroyable technologie ACARS » | « Réception ACARS via airframes.io. » |
| « Hey pilote, tu vas adorer ! » | « Briefing en 3 secondes. » |
| « Get started for free today » | « Commencer. » |

### Erreurs et messages système

- Pas d'excuses, pas de "désolé".
- Court, factuel, action claire.
- Exemple : « Pas de D-ATIS récent pour LFML. ATIS voix sur 124.825. »

### Voice dans la modale de premier lancement

« Ce service affiche des D-ATIS reçus via le réseau ACARS communautaire.
Les données peuvent être obsolètes, incomplètes ou erronées. À usage
informatif uniquement. Ne remplace pas les sources opérationnelles
officielles. »

Direct, technique, responsable. Le pilote signe en connaissance.

---

## 9. Photographie et imagerie

### Règle générale

**Pas de photographie dans le produit.** ATIS.live est une interface de
données pure. Le contenu visuel, c'est la donnée elle-même.

### Exceptions (site marketing, presse, RS)

- Photographies de cockpits **modernes** (glass cockpit, A320 et au-delà),
  jamais d'instruments à aiguilles
- Vues extérieures de pistes au lever/coucher du soleil
- Plans serrés sur des écrans EFB
- Jamais : pilotes souriants stock photo, parachutistes, drones,
  avions de tourisme général

### Style

- Si photographie : ton désaturé, contrasté, dramatique. Pas de stock
  photo HDR criarde.
- Référence : photographie aviation premium (campagnes Breitling,
  Patek Philippe avec aviateurs, Wallpaper magazine).

---

## 10. Site marketing — principes

### Structure

Une seule page (one-pager) en v1. Le produit, c'est l'app — le marketing
n'est pas le centre de gravité.

Sections : Hero → Démo → Sources → FAQ → Pricing → Footer.

### Hero

- Wordmark grand
- Une phrase produit (15 mots max)
- Un bouton « Ouvrir l'app » (action, pas inscription)
- Pas de hero illustration. Le wordmark + la prose, c'est le hero.

### Démo

- Screenshot ou screencast court (10s) de l'app sur une vraie page ATIS
- Annotations discrètes sur les features

### Pricing

- Tier Free et tier Pro côte-à-côte. Le Pro est mis en avant avec un
  border 0.5px Signal au lieu de Frame. Pas de "MOST POPULAR" badge
  clignotant.

### Footer

- Wordmark compact, statut (live/maintenance), mentions légales, sources
  de données attribuées, contact email
- Pas de "Made with ❤️". Jamais.

---

## 11. Réseaux sociaux

### Avatars

- Profile picture : mark `A·L` sur fond Void
- Cover photos : screenshot d'une page ATIS, ou wordmark grand sur fond
  Void avec un terrain européen en watermark mono

### Style des posts

- Court. Style Tweet aviation pro.
- Toujours signer les statistiques (« Source: airframes.io · 2026-05-14 »)
- Les changements de terrain (nouveau D-ATIS dispo) → format type
  « LFML now live. ATIS via airframes.io. »
- Pas d'engagement bait, pas de tags d'influenceurs

---

## 12. À faire en pratique

Pour appliquer cette charte à l'app existante, voici les actions
concrètes pour Claude Code :

1. **Polices** : intégrer Geist Sans et JetBrains Mono dans le projet.
   - Geist Sans via le package `geist/font` de Vercel (Next.js natif).
   - JetBrains Mono via Google Fonts ou en self-host via `next/font/google`.
   - Importer uniquement les poids utilisés (400, 500) pour ne pas
     gonfler le bundle.
2. **Variables CSS** : remplacer la palette actuelle par celle
   ci-dessus, nommées exactement comme dans la charte (`--color-void`,
   `--color-deck`, `--color-panel`, `--color-signal`, etc.).
3. **Wordmark** : créer un composant React `<Wordmark size="lg|md|sm" />`
   qui implémente le wordmark avec les deux poids mono et le point
   Signal animé.
4. **Favicon** : générer favicon depuis la variante `A·L` en SVG, mark
   blanc sur fond Void.
5. **Mode par défaut** : suivre le thème système iOS (light pour le
   jour, dark pour la nuit). Toggle utilisateur conserve le choix.
6. **Disclaimer modal** : implémenter selon la voice spec section 8.
7. **Open Graph image** : générer une image OG en 1200×630 avec
   wordmark grand centré sur fond Void et une lettre ATIS Signal
   en watermark.

---

## 13. Fichiers à produire (à terme)

- [ ] Logo SVG (wordmark large, compact, A·L mark)
- [ ] Favicon SVG + ICO + PNG multi-taille
- [ ] App icon iOS/Android (1024×1024 SVG source)
- [ ] Open Graph image 1200×630
- [ ] Twitter card image 1200×628
- [ ] Press kit ZIP (logos, palette, screenshots, tagline)
- [ ] Email signatures HTML

---

## 14. Ce que cette charte n'autorise pas

- Toute illustration figurative dans l'app (no birds, no clouds)
- Toute animation décorative non-fonctionnelle (no easter eggs)
- Toute mention de la marque sous forme « ATIS Live » sans le point
- Toute couleur additionnelle non listée dans la palette
- Toute police autre que Geist Sans/Mono
- Toute photo de pilote stock-photo
- Le mot « cockpit » utilisé en interface utilisateur (réservé au
  marketing si vraiment nécessaire)
- Les emojis dans toute communication produit ou support

Si quelqu'un (toi, un dev, un designer) propose d'ajouter un de ces
éléments « pour faire plus chaleureux / vivant / engageant », c'est le
signe qu'il n'a pas compris le positionnement. Refuser fermement.
