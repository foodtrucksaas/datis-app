# Phase 1 — Site D-ATIS Europe : front-end premium pour pilotes

## Contexte projet

Je construis un service web pour pilotes européens : agrégation des
D-ATIS européens reçus via ACARS, avec une UX léchée pensée pour
l'usage cockpit / pré-vol. Modèle freemium prévu plus tard, MVP gratuit
pour valider.

⚠️ Important : on ne fait jamais référence à des services concurrents
dans le produit, ni en lien externe, ni en mention textuelle. C'est
notre marque qui doit s'imposer.

Source de données : API airframes.io (j'ai un abonnement Pro à 12 $/mois).
**Mais cette session, on s'en fout.** Cette première session est 100 %
front-end avec des données mockées. On valide le design, l'UX et la
qualité visuelle avant de toucher au backend.

## ⚠️ Disclaimers légaux et sécurité — non négociable

C'est un produit lié à la sécurité aérienne. Les données affichées
peuvent ne pas être à jour, peuvent être incomplètes, ou tout simplement
fausses (erreur de réception ACARS, lag de propagation, panne d'un
feeder). On doit indiquer ça clairement et de plusieurs façons dans
le produit, pour deux raisons :

1. **Sécurité du pilote** : il ne doit jamais croire que cette app
   remplace une source officielle (D-ATIS de bord via datalink ARINC,
   voix VHF, ATIS DCDU/ACARS de la compagnie).
2. **Couverture juridique** : si un incident arrive et qu'un pilote a
   utilisé nos données, on doit pouvoir prouver qu'on a affiché des
   avertissements clairs et répétés.

### Où placer les disclaimers

**Au premier lancement** (modale d'acceptation, une seule fois,
persistée en localStorage) :

> **Avertissement important**
>
> Ce service affiche des D-ATIS reçus via le réseau communautaire ACARS
> (airframes.io). Les données peuvent être obsolètes, incomplètes ou
> erronées.
>
> **Ce service ne doit jamais être utilisé en cadre opérationnel.** Il
> ne remplace pas le D-ATIS officiel reçu en cockpit, l'ATIS voix VHF,
> ni les briefings de votre compagnie. Pour la préparation de vol et la
> conduite de vol, consultez exclusivement les sources officielles.
>
> [J'ai compris et j'accepte]

Le bouton est désactivé pendant 3 secondes après ouverture de la modale,
puis devient actif. Empêche le tap réflexe.

**Sur la page d'accueil**, sous le champ de saisie, en discret mais
toujours visible :

> Usage informatif uniquement · Pas de cadre opérationnel · Données
> non officielles

**Sur chaque page `/atis/[icao]`** :

- Une bannière fine en haut de page, juste sous le header, sur fond
  ambre très désaturé :
  > ⚠ Données non officielles · ne pas utiliser en cadre opérationnel
  Le pictogramme triangle d'avertissement à gauche. Cliquable pour
  rouvrir la modale complète. Cette bannière reste visible en
  permanence, ne se cache pas au scroll, mais reste discrète
  visuellement (typo 11px, opacité modérée).

- Dans le footer en bas de page, version longue :
  > Réception ACARS · airframes.io
  > Données pouvant être obsolètes ou erronées · pas une source
  > opérationnelle officielle · à des fins informatives uniquement

**Page Légal** `/legal` accessible depuis le footer (lien discret
"Mentions légales") :

Reprend en détail les disclaimers, la limitation de responsabilité,
les sources, et l'absence de garantie. À détailler dans un second
temps mais créer la route avec un placeholder texte propre dès la v1.

### Ton à utiliser

Pas alarmiste, pas paniqué. Factuel, professionnel, à la manière
d'un service aéronautique qui sait qu'il s'adresse à des
professionnels. Les pilotes détestent qu'on les prenne pour des
imbéciles, mais respectent les avertissements bien rédigés. Le ton
doit être celui d'un AIP / EUROCONTROL, pas celui d'une notice de
médicament.

## ⚠️ Mode de travail

Je code pas. Je travaille avec toi en vibe-coding. Donc :

- **Une étape à la fois.** À chaque étape, tu t'arrêtes, tu m'expliques
  ce que tu as fait en 3 lignes, et tu me dis ce qu'on fait après.
  J'approuve ou je redirige avant que tu continues.
- **Tu lances `npm run dev` à chaque étape majeure** pour que je puisse
  ouvrir le résultat dans mon navigateur et voir.
- **Pas de surprises.** Si tu hésites entre deux approches, tu me poses
  la question avec un exemple concret de chaque, plutôt que de choisir
  en silence.
- **README qui se met à jour** au fil du projet pour que je puisse y
  revenir dans 6 mois.

## Stack imposée — ne pas dévier

- **Next.js 15** App Router, TypeScript strict mode
- **Tailwind CSS** v4
- **shadcn/ui** pour les composants de base
- **Lucide React** pour les icônes
- **Fonts** : Inter (Google Fonts) pour l'UI, JetBrains Mono pour toute
  donnée brute aéronautique (METAR, TAF, raw ATIS)
- **Hébergement** : Vercel
- **Versioning** : GitHub
- **Backend / DB / Auth (phase 2)** : Supabase. On ne le branche PAS
  dans cette phase 1, mais structure le code pour faciliter
  l'intégration future. Concrètement :
  - Toute la "donnée" (favoris, récents, settings utilisateur, ATIS,
    METAR, TAF) passe par un module `lib/store.ts` qui abstrait la
    source. En phase 1, ce module lit/écrit localStorage et renvoie
    les mocks. En phase 2, on remplace l'implémentation par Supabase
    sans toucher aux composants.
  - Définir dès maintenant les types TypeScript "domaine" dans
    `lib/types.ts` (User, Favorite, AtisRecord, MetarRecord, etc.) qui
    matcheront les futures tables Supabase.

Pas de Material UI, pas de Chakra, pas de framer-motion sauf pour des
micro-interactions ciblées et discrètes.

## Design philosophy — c'est le cœur de cette session

C'est une app pour pilotes professionnels. Référence d'esthétique :
**ForeFlight, Garmin Pilot, SkyDemon** côté aviation, **Linear,
Vercel dashboard, Arc browser** côté SaaS moderne. Le résultat doit
sentir l'outil pro, pas la landing page SaaS générique.

### Ce qu'on veut

- **Dark mode par défaut**, AUCUN toggle vers le light mode dans cette
  v1 — c'est un outil cockpit, le sombre est la norme. Le light mode
  viendra peut-être plus tard.
- **Densité d'information élevée** sans être chargée. Les pilotes sont
  habitués à lire des plaques Jeppesen et des écrans EFB denses. On ne
  vise pas la simplicité Apple, on vise la lisibilité technique.
- **Typographie monospace pour toute donnée brute aéronautique.**
  C'est ce que les pilotes lisent depuis 50 ans, c'est non négociable.
- **Convention aéronautique respectée partout** : heures UTC avec suffixe
  "Z", ICAO en majuscules, vent en kt, QNH en hPa (Europe), visi en
  mètres ou km, altitudes en pieds, transition level/altitude avec FL.
- **Hiérarchie visuelle brutale.** Ce qu'un pilote cherche en premier
  quand il ouvre l'ATIS d'un terrain : lettre ATIS, piste en service,
  vent, QNH. Ces 4 infos doivent être lisibles en 0.5 seconde, à bras
  tendu, en lumière forte.
- **Fraîcheur de la donnée affichée bien en évidence.** Couleur sémantique
  selon l'âge du message (vert récent, orange tiède, rouge périmé).

### Ce qu'on ne veut surtout PAS

- Gradients pastel / blobs colorés / glassmorphism / aesthetic "AI SaaS
  2024"
- Hero section avec emoji et CTA "Get Started Free"
- Animations qui rebondissent / texte qui se révèle lettre par lettre /
  scroll parallax
- Cartes blanches arrondies sur fond gris clair
- Police par défaut système / serif inutile
- Stock illustrations type unDraw / Storyset
- Mode "fun" — on est dans le pro, c'est presque austère par choix

## Palette de couleurs

```css
/* Fond et surfaces */
--bg: #0A0E14;
--surface: #131820;
--surface-elevated: #1A2029;
--border: #232B36;

/* Texte */
--text-primary: #E6EDF3;
--text-secondary: #8B98A8;
--text-muted: #5A6675;

/* Accent — bleu instrument */
--accent: #38BDF8;
--accent-dim: #0EA5E9;

/* Sémantique fraîcheur */
--fresh: #4ADE80;
--warm: #FBBF24;
--stale: #F87171;
--cold: #6B7280;

/* Disclaimer / warning */
--warning-bg: rgba(251, 191, 36, 0.08);
--warning-border: rgba(251, 191, 36, 0.2);
--warning-text: #FBBF24;

/* Mono pour data */
--mono-bg: #0D1117;
```

## Pages à livrer dans cette session

### Modale d'avertissement au premier lancement

Détaillée dans la section disclaimers ci-dessus. Composant
`<FirstLaunchDisclaimer />` monté à la racine, vérifie le localStorage,
affiche la modale si l'utilisateur ne l'a jamais acceptée. Une fois
acceptée, plus jamais affichée automatiquement (mais accessible via
clic sur la bannière de chaque page ATIS).

### `/` — Home / lookup

Page d'entrée. Au centre, gros champ de saisie ICAO (4 lettres,
majuscules forcées, validation visuelle, autocomplete sur une liste
statique de 50 terrains EU majeurs à mettre dans `/lib/airports.ts`).
Sous le champ : section "Récents" (vide en v1, à connecter à
localStorage plus tard) et section "Favoris" (vide aussi).

Header sobre : nom du produit à gauche (mettre "ATIS·EU" en placeholder),
rien d'autre pour l'instant. Pas de nav.

Disclaimer court juste sous le champ, comme spécifié ci-dessus.

### `/atis/[icao]` — Page de résultat

C'est la page qui doit être *parfaite*. Quand un pilote arrive là, il
doit avoir l'info qu'il cherche immédiatement.

**Layout mobile-first**, lisible en portrait sur iPhone :

1. **Bannière de disclaimer** en haut de page (voir section
   disclaimers), persistante, cliquable pour rouvrir la modale
   complète.

2. **Header compact** : ICAO en gros (ex. "LFPG"), nom de l'aéroport en
   dessous (ex. "Paris-Charles de Gaulle"), bouton favori étoile à
   droite.

3. **Bloc ATIS principal** — le money shot :
   - Énorme : la lettre ATIS centrée (ex. "INFO B") — typo monospace,
     très large
   - Sous-titre : "reçu il y a 12 min" avec pastille colorée selon
     fraîcheur, et heure UTC d'émission (ex. "1530Z")
   - Grid 2x2 des infos critiques, chacune dans une mini-carte :
     - **Arrivée** — pistes ARR (ex. "27R · 26L")
     - **Vent** — "250° / 12 kt" (avec rafales si présentes)
     - **QNH** — gros chiffre + unité (hPa)
     - **Visibilité** — synthèse courte (CAVOK en vert si applicable)
   - Plus bas, ligne discrète : pistes Départ, Transition Level,
     température/dewpoint
   - Bloc dépliable : remarks / NOTAMs ATIS extraits

4. **Bloc Raw ATIS** : monospace, fond légèrement plus sombre que la
   carte, scrollable horizontalement si trop long. Bouton "Copier" en
   haut à droite du bloc.

5. **Bloc METAR** : raw monospace par défaut, avec un toggle "Raw /
   Decoded" en haut à droite du bloc (style AeroWeather). En mode
   Decoded, chaque token du METAR est traduit en clair sur sa propre
   ligne : "Wind: 250° at 12 kt, variable 220°-280°", "Visibility:
   CAVOK", "Temperature: 14°C / Dewpoint: 8°C", "QNH: 1018 hPa", etc.
   Le toggle est persisté en localStorage et partagé avec le bloc TAF
   (un seul setting global Raw/Decoded pour les deux). Âge de la donnée
   à droite du label, à côté du toggle.

6. **Bloc TAF** : même structure que METAR, même toggle (synchronisé),
   avec décodage adapté aux périodes de validité, BECMG, TEMPO, PROB,
   FM, etc. Heure d'émission affichée.

### Décodage METAR/TAF — règles

Le décodage doit être lisible mais sans perdre l'info technique. Garde
les unités aéro (kt, hPa, °C, ft, FL, NM). Une ligne par token
sémantique. Couleur sémantique sur les valeurs critiques : visibilité
basse en orange/rouge, vents forts en orange, plafonds bas en orange.
Si un token n'est pas reconnu par le parser, affiche-le raw avec un
discret "(non décodé)" — ne crash jamais. Mets le parser dans
`lib/metar-parser.ts` et `lib/taf-parser.ts`, avec quelques tests
unitaires sur des cas réels.

7. **Footer de page** : à gauche en très discret, sur deux/trois lignes,
   la mention complète : "Réception ACARS · airframes.io / Données
   pouvant être obsolètes ou erronées / pas une source opérationnelle
   officielle". À droite, un bouton "Actualiser" avec icône refresh.
   Sous le tout, lien discret "Mentions légales" vers `/legal`.

### `/legal` — Mentions légales

Page simple, lisible, contenu placeholder à enrichir plus tard :

- Nom du service et qu'est-ce que c'est
- Source des données et leur nature (ACARS communautaire via
  airframes.io)
- Limitations : données non officielles, peuvent être obsolètes,
  incomplètes, erronées
- Usage strictement informatif, ne remplace pas les sources
  opérationnelles officielles
- Limitation de responsabilité : l'utilisateur reste seul responsable
  de la décision d'utiliser ces données, à compléter par un avocat plus
  tard
- Contact (placeholder)

### État "pas de D-ATIS dispo"

Si un ICAO n'a pas de D-ATIS dans le mock : afficher proprement "Pas de
D-ATIS récent capté pour ce terrain. Réessaye dans quelques minutes ou
consulte le voix ATIS." Afficher quand même le METAR/TAF mocké en
dessous si on en a. Pas de page d'erreur, pas de lien externe.

### Mock data

Crée `/lib/mock-data.ts` avec des réponses crédibles pour **LFPG, LFPB,
EGLL, EDDF, EHAM**. Texte ATIS raw réaliste pour chaque. Le routing
dynamique doit fonctionner pour ces 5 ICAO et afficher l'état "pas
trouvé" pour les autres.

## Composants à créer dans `/components`

- `FirstLaunchDisclaimer` — modale au premier lancement avec délai 3s
  avant activation du bouton
- `WarningBanner` — bannière persistante en haut des pages ATIS
- `IcaoInput` — champ de saisie avec autocomplete
- `AtisCard` — la grosse carte de la lettre ATIS
- `MetricTile` — la mini-carte pour piste / vent / QNH / visi
- `FreshnessBadge` — pastille colorée + texte âge
- `RawDataBlock` — bloc monospace avec bouton copier
- `WeatherBlock` — wrapper METAR ou TAF avec toggle Raw/Decoded
- `DecodedMetar` — affichage METAR décodé ligne par ligne
- `DecodedTaf` — affichage TAF décodé avec gestion des périodes
- `RawDecodedToggle` — toggle Raw/Decoded synchronisé via localStorage
- `AirportHeader` — ICAO + nom + bouton favori
- `RefreshButton` — bouton actualiser du footer
- `PageFooter` — footer avec attribution + disclaimer + lien légal

Tous typés strict, props bien définies, pas de `any`.

## Premier message à m'envoyer

**Étape 0 — sauvegarde du brief** : avant toute autre chose, copie
l'intégralité de ce brief dans un fichier `brief.md` à la racine du
projet. Garde-le tel quel, mot pour mot. On s'y référera tout au long
du développement, et il doit rester accessible pour vérifier qu'on
respecte les specs.

Ensuite :

1. **Confirme la stack** : tu m'expliques en 5 lignes ce que tu vas
   initialiser (Next.js 15 + Tailwind + shadcn/ui setup), pour qu'on
   parte sur la même base.
2. **Montre-moi en ASCII art ou en description écrite à quoi va
   ressembler la page `/atis/LFPG`** avant d'écrire une ligne de code,
   en incluant bien la bannière de disclaimer en haut. Je veux valider
   la hiérarchie visuelle avant que tu codes.

Puis tu attends ma validation avant de coder.
