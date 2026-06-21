---
type: reference
tags: [design-system, website, astro, tailwind]
created: 2026-06-18
last_updated: 2026-06-18
---

# Design System — mathieukuntz.com

**Référence obligatoire** pour toute création ou modification de page sur le site `website-mathieukuntz-com`. À consulter avant d'écrire le moindre composant Astro.

Le site fonctionne avec **deux thèmes distincts** partageant un accent doré commun (`#E8C76A`). Chaque thème a son propre layout, sa palette et ses polices.

- **Thème Clair** (`MainLayout.astro`) — page principale et pages institutionnelles
- **Thème Sombre** (`PrinceLayout.astro`) — pages de vente spectacle (immersive, poétique)

---

## 1. Stack technique

| Élément | Valeur |
|---------|--------|
| Framework | Astro 6 (static output) |
| CSS | Tailwind v4 via `@tailwindcss/vite` (compilé, **pas de CDN**) |
| Icônes | Iconify via `<script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js">` (chargé dans les layouts) |
| Polices | Google Fonts (chargées dans les layouts) |
| CSS global | `src/styles/global.css` → `@import "tailwindcss";` |

**Règle :** ne jamais réinjecter `<script src="https://cdn.tailwindcss.com">`. Les classes Tailwind sont compilées à la build. Toute classe utilisée dans un composant `.astro` est automatiquement incluse dans le CSS final.

**Règle :** ne jamais réimporter les polices ni le script Iconify dans les composants. Ils sont déjà dans les layouts. Les composants ne contiennent que du markup + styles scoped.

---

## 2. Thème Clair — `MainLayout.astro`

Pour : page d'accueil, pages institutionnelles, pages "qui je suis", contact, etc.

### Polices

| Usage | Famille | Google Fonts import |
|-------|---------|---------------------|
| Tout le texte | `'Plus Jakarta Sans', sans-serif` | weights `300;400;500;600;700;800` |

Pas de police serif sur ce thème. Les titres utilisent la même police sans-serif, en `font-semibold` ou `font-bold`.

### Couleurs

| Token | Valeur | Usage |
|-------|--------|-------|
| **Background primary** | `#F7F5F1` | fond de page (crème chaud) |
| **Background secondary** | `#EDEAE4` | sections alternées, blobs flous (souvent en `/40` ou `/20` d'opacité) |
| **Text primary** | `#1A1A1A` | texte courant |
| **Text secondary** | `stone-600` | descriptions, paragraphes |
| **Text muted** | `stone-400` | labels, métadonnées |
| **Card background** | `white` | cartes |
| **Border** | `stone-200` (`/60` ou `/80`) | bordures de cartes, séparateurs |
| **Dark surface** | `stone-900` | footer, boutons primaires, cartes sombres |
| **Dark surface hover** | `stone-700` / `stone-800` | hover boutons |
| **Accent gold** | `#E8C76A` | puces de listes, highlights sur fond sombre uniquement (promo banner, footer) |
| **Promo banner bg** | `#0F172A` | bandeau promo (slate sombre) |
| **Promo banner text** | `#F2EFEA` | texte du bandeau promo |

### Sélection de texte
- `selection:bg-stone-800 selection:text-white`

---

## 3. Thème Sombre — `PrinceLayout.astro`

Pour : pages de vente spectacle (immersif, poétique, nocturne).

### Polices

| Usage | Famille | Classe | Google Fonts import |
|-------|---------|--------|---------------------|
| Texte courant | `'Manrope', sans-serif` | (défaut body) | weights `300;400;500;600;700;800` |
| Titres / accents | `'Cormorant Garamond', serif` | `.font-serif` | `0,400;0,500;0,600;0,700;1,400;1,500` (italique inclus) |

**Règle :** utiliser `.font-serif` sur tous les `h1`, `h2`, `h3`, les grands chiffres décoratifs (`01`, `02`...) et les citations poétiques. Le body reste en Manrope.

### Couleurs

| Token | Valeur | Usage |
|-------|--------|-------|
| **Background primary** | `#0A0A14` | fond de page (noir bleuté profond) |
| **Background secondary** | `#0C0C18` | sections alternées (`/60` ou `/40` d'opacité) |
| **Footer background** | `#05050C` | footer (encore plus sombre) |
| **Text primary** | `#F2EFEA` | texte courant (blanc chaud) |
| **Text secondary** | `#F2EFEA` à `/80`, `/85`, `/90` | descriptions (jouer sur l'opacité) |
| **Text muted** | `white/50`, `white/40`, `white/30` | labels, mentions discrètes |
| **Accent gold** | `#E8C76A` | CTA, titres accentués, icônes, badges |
| **Accent gold hover** | `white` | hover CTA (passe au blanc) |
| **Accent purple** | `#2A1E5C` | glow, badges d'étapes (`/30`, `/40`, `/50`) |
| **Card background** | `white/[0.02]` | cartes (presque transparent) |
| **Card hover bg** | `white/[0.04]` | hover cartes |
| **Border subtle** | `white/5`, `white/10` | bordures discrètes |
| **Border accent hover** | `#E8C76A/20`, `#E8C76A/40` | bordures au hover |
| **Negative (anti-checklist)** | `red-400` (texte), `red-950/[0.05]` (bg), `red-500/10` (border) | section "n'est pas pour vous si" |

### Sélection de texte
- `selection:bg-[#E8C76A] selection:text-[#0A0A14]`

### Effets de lumière (uniques au thème sombre)

Définis en CSS global dans `PrinceLayout.astro` :

| Classe | Effet |
|--------|-------|
| `.glow-radial` | `radial-gradient(circle at center, rgba(42,30,92,0.45) 0%, rgba(7,19,38,0.2) 70%, transparent 100%)` — halo violet |
| `.glow-gold` | `radial-gradient(circle at center, rgba(232,199,106,0.08) 0%, transparent 70%)` — halo doré |

Blobs ambiants placés en `absolute -z-10 pointer-events-none` dans le layout (3 instances : haut centre, droite, bas gauche). Ne pas les supprimer.

---

## 4. Espacements

Valeurs Tailwind utilisées de façon systématique. Respecter ces standards pour la cohérence.

### Sections

| Contexte | Classe |
|----------|--------|
| Section standard (clair) | `py-24 px-6 lg:px-16 border-t border-stone-200` |
| Section alternée (clair) | + `bg-[#EDEAE4]/40` ou `bg-[#EDEAE4]/20` |
| Section standard (sombre) | `py-24 px-6 md:px-12 border-t border-white/5` |
| Section alternée (sombre) | + `bg-[#0C0C18]/60` ou `bg-[#0C0C18]/40` |

### Conteneurs (max-width)

| Classe | Usage |
|--------|-------|
| `max-w-7xl mx-auto` | conteneur principal (sections larges) |
| `max-w-5xl mx-auto` | section centrée étroite (déroulé, FAQ) |
| `max-w-4xl mx-auto` | infos pratiques, CTA final |
| `max-w-3xl mx-auto` | intro de section centrée |
| `max-w-2xl` | paragraphe d'intro, limite de lecture |
| `max-w-xl` | texte hero |

### Grilles

| Contexte | Classe |
|----------|--------|
| Hero (texte + visuel) | `grid grid-cols-1 lg:grid-cols-12 gap-12 items-center` (col-span-7 / col-span-5) |
| Cartes en 2 colonnes | `grid grid-cols-1 md:grid-cols-2 gap-8` |
| Cartes en 3 colonnes | `grid grid-cols-1 md:grid-cols-3 gap-6` ou `gap-8` |
| Cartes en 4 colonnes | `grid grid-cols-1 md:grid-cols-4 gap-6` |

### Cartes

| Contexte | Classe |
|----------|--------|
| Carte claire | `p-8 bg-white border border-stone-200/60 rounded-2xl` |
| Carte sombre | `p-8 rounded-2xl bg-white/[0.02] border border-white/5` |
| Carte sombre hover | `hover:border-[#E8C76A]/20 hover:bg-white/[0.04] transition-all duration-300` |
| Carte claire hover | `hover:shadow-sm transition-shadow duration-300` |

### Border-radius

| Classe | Usage |
|--------|-------|
| `rounded-2xl` | cartes, conteneurs de section, badges d'image |
| `rounded-3xl` | gros visuels artistiques (artiste) |
| `rounded-full` | boutons, pills, badges, puces |
| `rounded-xl` | petites cartes secondaires |
| `rounded-t-[2.5rem]` | haut de footer arrondi (clair uniquement) |
| `rounded-lg` / `rounded-md` | éléments plus petits (badges, tags) |

---

## 5. Typographie

### Tailles de titres

| Contexte | Classe |
|----------|--------|
| Hero h1 (clair) | `text-4xl md:text-5xl lg:text-6xl ... font-normal leading-tight tracking-tight` |
| Hero h1 (sombre) | `text-4xl md:text-6xl lg:text-7xl font-serif leading-[1.15] tracking-tight` |
| Section h2 (clair) | `text-5xl md:text-6xl ... font-semibold tracking-tight` |
| Section h2 (sombre) | `text-3xl md:text-5xl font-serif tracking-tight` |
| Sous-titre h3 | `text-xl` à `text-2xl`, `font-medium` ou `font-semibold` |
| Carte h3 (sombre) | `text-xl md:text-2xl font-serif tracking-tight` |

### Tailles de corps

| Contexte | Classe |
|----------|--------|
| Paragraphe principal | `text-lg md:text-xl font-light leading-relaxed` |
| Paragraphe secondaire | `text-base md:text-lg font-light leading-relaxed` |
| Petit texte / mention | `text-sm` ou `text-xs` |
| Label / kicker | `text-xs font-semibold uppercase tracking-widest` |

### Kickers (petits labels au-dessus des titres)

- Clair : `text-xs font-semibold uppercase tracking-widest text-stone-400 block mb-3`
- Sombre : `text-sm uppercase tracking-widest text-[#E8C76A] font-bold`

---

## 6. Boutons & CTAs

### Thème clair

| Type | Classe |
|------|--------|
| **Primaire** | `px-8 py-3.5 bg-stone-900 text-[#F7F5F1] rounded-full text-sm font-medium hover:bg-stone-700 transition-colors duration-300` |
| **Secondaire (outline)** | `px-8 py-3.5 border border-stone-300 text-stone-900 rounded-full text-sm font-medium hover:bg-stone-200/50 transition-colors duration-300` |
| **Gros CTA final** | `inline-flex items-center gap-2 px-8 py-4 bg-stone-900 text-[#F7F5F1] rounded-full text-base font-semibold hover:bg-stone-700 transition-colors` |
| **Pill sombre (sur fond clair, ex: programmer)** | `px-6 py-3 bg-stone-950 text-white text-sm font-semibold rounded-full hover:bg-stone-800 transition-colors` |

### Thème sombre

| Type | Classe |
|------|--------|
| **Primaire (gold)** | `px-8 py-4 bg-[#E8C76A] text-[#0A0A14] font-semibold text-sm tracking-widest uppercase rounded-full hover:bg-white hover:scale-105 transition-all duration-300 shadow-lg shadow-[#E8C76A]/10` |
| **Secondaire (outline)** | `px-8 py-4 border border-white/10 text-[#F2EFEA] hover:bg-white/5 hover:border-white/30 rounded-full text-sm font-semibold tracking-widest uppercase transition-all duration-300` |
| **Gros CTA final** | `px-12 py-5 bg-[#E8C76A] text-[#0A0A14] font-bold text-sm tracking-widest uppercase rounded-full hover:bg-white hover:scale-105 transition-all duration-300 shadow-xl shadow-[#E8C76A]/20` |
| **Pill lien (footer)** | `inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#E8C76A]/40 rounded-full text-xs font-semibold tracking-wider uppercase text-[#E8C76A]` |

**Règle :** sur le thème sombre, les CTAs principaux sont **toujours** en `uppercase tracking-widest`. Sur le thème clair, les CTAs restent en casse normale.

---

## 7. Composants réutilisables identifiés

Patterns à reproduire pour toute nouvelle page cohérente.

### Badge / Pill (kicker doré, thème sombre)
```html
<span class="inline-flex items-center gap-2 py-2 px-4 border border-[#E8C76A]/20 rounded-full text-sm font-semibold uppercase tracking-widest text-[#E8C76A] bg-[#E8C76A]/5 backdrop-blur-sm">
  <iconify-icon icon="solar:..."></iconify-icon>
  Texte
</span>
```

### Badge d'étape (timeline, thème sombre)
```html
<span class="inline-block px-4 py-1.5 bg-[#2A1E5C]/40 border border-white/5 text-[#E8C76A] text-sm font-semibold uppercase tracking-widest rounded-full">Étape 1</span>
```

### Carte numérotée (thème sombre)
```html
<div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#E8C76A]/20 hover:bg-white/[0.04] transition-all duration-300 space-y-4">
  <span class="font-serif text-4xl text-[#E8C76A]/50 block">01</span>
  <h3 class="text-xl md:text-2xl text-[#F2EFEA] font-serif tracking-tight">Titre</h3>
  <p class="text-sm md:text-base text-[#F2EFEA]/80 leading-relaxed font-light">Texte</p>
</div>
```

### Carte icône (thème clair)
```html
<div class="p-8 bg-white border border-stone-200/60 rounded-2xl flex flex-col justify-between hover:shadow-sm transition-shadow duration-300">
  <div>
    <div class="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-6">
      <iconify-icon icon="solar:ticket-linear" class="text-xl text-stone-800" stroke-width="1.5"></iconify-icon>
    </div>
    <span class="text-xs font-semibold text-stone-400 tracking-wider block mb-1">01</span>
    <h3 class="text-xl font-medium text-stone-900 mb-3 tracking-tight">Titre</h3>
    <p class="text-base md:text-lg text-stone-600 font-light leading-relaxed">Texte</p>
  </div>
</div>
```

### Accordéon FAQ (thème sombre)
```html
<details class="group border border-white/5 rounded-2xl bg-white/[0.01] hover:border-[#E8C76A]/20 transition-all duration-300">
  <summary class="flex justify-between items-center p-6 cursor-pointer select-none">
    <span class="text-sm md:text-base font-bold text-[#F2EFEA] uppercase tracking-wide">Question</span>
    <div class="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-open:rotate-45 transition-transform duration-300">
      <iconify-icon icon="solar:add-circle-linear" class="text-[#E8C76A]"></iconify-icon>
    </div>
  </summary>
  <div class="px-6 pb-6 text-sm md:text-base text-[#F2EFEA]/80 font-light leading-relaxed">Réponse</div>
</details>
```

### Ligne de tableau infos (thème sombre)
```html
<div class="grid grid-cols-3 p-6 gap-4 items-center">
  <span class="text-xs md:text-sm uppercase tracking-widest text-[#E8C76A] font-bold col-span-1">Label</span>
  <span class="text-sm md:text-base text-[#F2EFEA] col-span-2 font-semibold">Valeur</span>
</div>
```

---

## 8. Icônes

**Bibliothèque :** Solar (via Iconify). Préfixe `solar:`.

Usage : `<iconify-icon icon="solar:ticket-linear" stroke-width="1.5"></iconify-icon>`

Icônes déjà utilisées (réutiliser les mêmes pour cohérence) :

| Icône | Usage |
|-------|-------|
| `solar:ticket-linear` | spectacles |
| `solar:heart-linear` | thérapie / accompagnement |
| `solar:compass-linear` | stages / aventures |
| `solar:microphone-large-linear` | formation / conférence |
| `solar:medal-ribbons-linear` | préparation mentale |
| `solar:arrow-right-linear` | CTA flèche |
| `solar:hamburger-menu-linear` | menu mobile |
| `solar:close-circle-linear` | fermer |
| `solar:chat-line-linear` | contact |
| `solar:calendar-minimalistic-linear` | rendez-vous |
| `solar:pen-new-square-linear` | construire / écrire |
| `solar:user-circle-linear` | Instagram / profil |
| `solar:users-group-two-rounded-linear` | groupe / identité |
| `solar:stars-line-duotone` | hero spectacle |
| `solar:play-bold` | lecture vidéo |
| `solar:videocamera-record-bold` | teaser |
| `solar:gallery-wide-bold` | affiche |
| `solar:camera-linear` | Instagram (sombre) |
| `solar:global-linear` | site web |
| `solar:phone-linear` | téléphone |
| `solar:letter-linear` | email |
| `solar:add-circle-linear` | FAQ accordion |
| `solar:close-circle-linear` | anti-checklist |

**Règle :** rester dans la librairie Solar. `stroke-width="1.5"` par défaut sur les icônes lineaires.

---

## 9. Liens internes

**Règle absolue :** tous les liens internes utilisent des chemins **absolus** commençant par `/` (pas de `#section` seul, pas de chemins relatifs).

| Cible | Lien |
|-------|------|
| Accueil | `/` |
| Section accueil | `/#qui-je-suis`, `/#spectacles`, `/#contact`, etc. |
| Page Prince | `/prince` |
| Section Prince | `/prince#experience`, `/prince#artiste`, etc. |

Les ancres `#` seules cassent la navigation inter-pages (elles restent sur la page courante). Toujours préfixer avec la route.

---

## 10. Patterns de structure de page

### Page institutionnelle (thème clair)

```
<MainLayout title="..." description="...">
  <Navbar />          ← sticky, promo banner optionnel
  <Hero />            ← min-h-[85vh], grille 12 colonnes
  <Section />         ← py-24, kicker + h2 + contenu
  ...
  <Contact />
  <Footer />
</MainLayout>
```

### Page de vente spectacle (thème sombre)

```
<PrinceLayout title="..." description="...">
  <Navbar />          ← sticky, logo spectacle + CTA billet
  <Hero />            ← min-h-[90vh], grille 12 colonnes + teaser vidéo
  <Experience />      ← grille 5/7, texte + visuel
  <Deroule />         ← timeline alternée
  <PourQui />         ← grille 4 cartes + anti-checklist
  <Artiste />         ← grille 5/7
  <Infos />           ← tableau de infos pratiques
  <FAQ />             ← accordions
  <FinalCTA />        ← CTA centré sur glow-gold
  <Footer />
  <MobileCTABar />    ← sticky bottom mobile
</PrinceLayout>
```

---

## 11. Règles de création de nouvelle page

1. **Choisir le thème** selon le type de page (clair = institutionnel, sombre = vente/immersif). Si doute, demander.
2. **Créer un dossier de composants** dans `src/components/[nom-page]/` (un composant par section).
3. **Créer la page** dans `src/pages/[route].astro` qui importe et assemble les composants dans le layout approprié.
4. **Resposer les espacements standards** (`py-24`, `max-w-7xl mx-auto`, `gap-8`/`gap-12`).
5. **Liens internes en chemins absolus** (`/`, `/prince`, `/#section`).
6. **Icônes Solar uniquement**, `stroke-width="1.5"`.
7. **Tester le build** : `npm run build` avant de pousser.
8. **Push** : `git add -A && git commit -m "..." && git push origin main` (déploiement Cloudflare automatique).
