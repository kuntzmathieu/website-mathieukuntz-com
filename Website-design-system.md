---
type: reference
tags: [design-system, website, astro, tailwind]
created: 2026-06-21
last_updated: 2026-06-21
---

# Design System — mathieukuntz.com (nouveau)

**Référence obligatoire** pour toute création ou modification de page sur le site `website-mathieukuntz-com`. À consulter avant d'écrire le moindre composant Astro.

Le site fonctionne avec **deux thèmes distincts** :

- **Thème Clair** (`MainLayout.astro`) — page d'accueil et pages institutionnelles (nouveau design, juin 2026)
- **Thème Sombre** (`PrinceLayout.astro`) — pages de vente spectacle (immersive, poétique, inchangé)

L'ancien design system est archivé dans [[Website-design-system ARCHIVE]].

---

## 1. Stack technique

| Élément | Valeur |
|---------|--------|
| Framework | Astro 6 (static output) |
| CSS | Tailwind v4 via `@tailwindcss/vite` (compilé, **pas de CDN**) |
| Icônes (thème clair) | **Lucide** via `<script src="https://unpkg.com/lucide@latest"></script>` (chargé dans `MainLayout.astro`) |
| Icônes (thème sombre) | **Iconify/Solar** via `<script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js">` (chargé dans `PrinceLayout.astro`) |
| Polices | Google Fonts (chargées dans les layouts) |
| CSS global | `src/styles/global.css` → `@import "tailwindcss";` |
| Analytics | GA4 (`G-2M6V79H761`) dans `MainLayout.astro` |
| Meta Pixel | Dans `PrinceLayout.astro` uniquement (via `PUBLIC_META_PIXEL_ID`) |

**Règle :** ne jamais réinjecter `<script src="https://cdn.tailwindcss.com">`. Les classes Tailwind sont compilées à la build.

**Règle :** ne jamais réimporter les polices, les icônes ni GA4 dans les composants. Ils sont déjà dans les layouts. Les composants ne contiennent que du markup + styles scoped.

**Règle :** le thème clair utilise **Lucide** (`<i data-lucide="icon-name" class="w-5 h-5 stroke-[1.5]"></i>`), le thème sombre utilise **Iconify/Solar** (`<iconify-icon icon="solar:icon-name" stroke-width="1.5"></iconify-icon>`). Ne pas mélanger.

---

## 2. Thème Clair — `MainLayout.astro`

Pour : page d'accueil, pages institutionnelles, pages "qui je suis", contact, etc.

### Polices

| Usage | Famille | Google Fonts import |
|-------|---------|---------------------|
| Tout le texte | `'Inter', sans-serif` | weights `300;400;500;600` |

Une seule police. Les titres utilisent la même Inter, en `font-medium` ou `font-normal`, jouant sur la taille et le `tracking-tighter` pour la hiérarchie.

### Couleurs

| Token | Valeur | Usage |
|-------|--------|-------|
| **Background primary** | `#f5f4f0` | fond de page (beige chaud) |
| **Background secondary** | `#f5f4f0` | sections alternées (même couleur, alternance avec `bg-white`) |
| **Background tertiary** | `#e8eae4` | stats bar, section contact (vert gris clair) |
| **Background dark** | `#1a1a1a` | navbar CTA, promo banner, footer sombre |
| **Text primary** | `#1a1a1a` | texte courant, titres |
| **Text secondary** | `#5c5c5a` | descriptions, paragraphes, labels |
| **Text muted** | `#a0a09e` | placeholders, mentions discrètes |
| **Card background** | `#f5f4f0` | cartes d'activités (même que fond page, sur sections blanches) |
| **White surface** | `white` | sections alternées, intérieur de cartes image |
| **Border** | `#dcdacd` | bordures, séparateurs (souvent `/50` d'opacité) |
| **Accent (olive)** | `#5d674f` | kickers, liens hover, boutons primaires, icônes accent |
| **Accent hover (olive dark)** | `#4a523f` | hover boutons primaires |
| **Accent light** | `#e8eae4` | texte sur fond sombre, CTA du promo banner |
| **Badge cream** | `#f2ece5` | badges flottants du hero, badges gradient |

### Sélection de texte
- `selection:bg-[#5d674f] selection:text-white`

### PromoBanner

| Token | Valeur | Usage |
|-------|--------|-------|
| **Background** | `#1a1a1a` | fond noir |
| **Text** | `text-white/80` | texte descriptif |
| **Accent label** | `#e8eae4` | nom du spectacle, CTA |
| **CTA bg** | `#e8eae4` | bouton réserver (fond clair sur noir) |
| **CTA hover** | `white` | hover du bouton |
| **Position** | `fixed top-24` | sous la navbar (qui fait `h-24` = 96px) |

---

## 3. Thème Sombre — `PrinceLayout.astro`

**Inchangé.** Voir l'ancien design system archivé ([[Website-design-system ARCHIVE]]) pour le détail complet du thème sombre.

Résumé rapide :
- Polices : Manrope (body) + Cormorant Garamond (titres via `.font-serif`)
- Fond : `#0A0A14` (noir bleuté)
- Accent : `#E8C76A` (doré)
- Icônes : Iconify/Solar
- Effets : `.glow-radial`, `.glow-gold`

---

## 4. Espacements

### Sections

| Contexte | Classe |
|----------|--------|
| Section standard (clair) | `py-24 md:py-40 px-6 md:px-12` |
| Section alternée (clair) | alterner `bg-white` et `bg-[#f5f4f0]` |
| Section avec bordure | `border-t border-[#dcdacd]` |
| Section contact | `bg-[#e8eae4] text-center px-6` |
| Hero | `min-h-screen pt-44 lg:pt-52` (padding top pour navbar + promobanner) |

### Conteneurs (max-width)

| Classe | Usage |
|--------|--------|
| `max-w-screen-2xl mx-auto` | conteneur principal large (hero, navbar, footer) |
| `max-w-screen-xl mx-auto` | sections moyennes (activités, schedule) |
| `max-w-3xl mx-auto` | section contact (centrée étroite) |
| `max-w-xl` | stats bar, textes limités |
| `max-w-md` | subheadline du hero |

### Grilles

| Contexte | Classe |
|----------|--------|
| Hero (texte + visuel) | `grid lg:grid-cols-12 gap-12 lg:gap-0` (col-span-5 / col-span-7) |
| Cartes en 2 colonnes | `grid grid-cols-1 md:grid-cols-2 gap-6` |
| Stats (3 colonnes) | `grid grid-cols-3 gap-6 lg:gap-12` |
| Footer (4 colonnes) | `grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-24` |

### Cartes (section Activités)

| Contexte | Classe |
|----------|--------|
| Carte d'activité | `bg-[#f5f4f0] rounded-[32px] p-4 flex flex-col group hover:shadow-xl hover:shadow-black/5 duration-500` |
| Image de carte | `w-full aspect-[4/3] rounded-[24px] overflow-hidden mb-6` |
| Hover image | `group-hover:scale-105 transition-transform duration-700` |

### Border-radius

| Classe | Usage |
|--------|--------|
| `rounded-[32px]` | cartes d'activités (grand rayon) |
| `rounded-[24px]` | images dans les cartes |
| `rounded-3xl` | portraits, grands visuels |
| `rounded-full` | boutons, pills, badges circulaires, écrous |
| `rounded-[2rem]` | cartes template (scroll horizontal, pricing) |
| `rounded-tr-[80px] lg:rounded-tr-[120px]` | stats bar (forme organique) |
| `rounded-bl-[40px]` | (ancien bouton flottant, plus utilisé) |
| `rounded-t-full rounded-bl-full rounded-br-sm` | badge "Un projet ?" (forme organique) |

---

## 5. Typographie

### Tailles de titres

| Contexte | Classe |
|----------|--------|
| Hero h1 | `text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.05] tracking-tighter font-medium` |
| Section h2 | `text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight` |
| Section h2 (compact) | `text-4xl md:text-5xl tracking-tight font-medium` |
| Sous-titre h3 | `text-2xl font-medium tracking-tight` |
| Contact h2 | `text-5xl md:text-7xl tracking-tighter font-medium` |

### Tailles de corps

| Contexte | Classe |
|----------|--------|
| Subheadline hero | `text-lg md:text-xl text-[#5c5c5a] font-normal leading-relaxed` |
| Paragraphe standard | `text-lg text-[#5c5c5a] font-normal leading-relaxed` |
| Description carte | `text-base text-[#5c5c5a] font-light leading-relaxed` |
| Petit texte | `text-sm` ou `text-xs` |
| Label / kicker | `text-[10px] font-medium tracking-[0.2em] uppercase text-[#5d674f]` |
| Label section (Qui je suis) | `text-sm font-medium tracking-widest uppercase text-[#5d674f]` |
| Stats label | `text-[10px] tracking-widest uppercase text-[#5c5c5a]` |
| Stats chiffre | `text-3xl lg:text-4xl font-medium tracking-tight text-[#1a1a1a]` |

### Kickers (petits labels au-dessus des titres)

- Avec tiret : `inline-flex items-center gap-3` > `<span class="w-8 h-[1px] bg-[#5d674f]"></span>` + `<span class="text-sm font-medium tracking-widest uppercase text-[#5d674f]">Texte</span>`
- Simple : `text-[10px] font-medium tracking-[0.2em] uppercase text-[#5d674f] mb-4 block`

---

## 6. Boutons & CTAs

### Thème clair

| Type | Classe |
|------|--------|
| **Primaire (olive)** | `inline-flex bg-[#5d674f] text-white px-8 py-5 rounded-full items-center gap-3 hover:bg-[#4a523f] transition-colors group` |
| **Navbar CTA (noir)** | `bg-[#1a1a1a] text-white px-6 py-3 rounded-full text-base font-normal hover:bg-[#333] transition-colors` |
| **Lien texte (border-bottom)** | `inline-flex items-center gap-2 text-[#1a1a1a] border-b border-[#1a1a1a] pb-1 hover:text-[#5d674f] hover:border-[#5d674f] transition-colors group` |
| **Lien carte (uppercase)** | `inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] uppercase text-[#1a1a1a] group-hover:text-[#5d674f] transition-colors mt-auto` |
| **CTA contact (noir large)** | `bg-[#1a1a1a] text-white px-10 py-5 rounded-full flex items-center gap-3 font-normal text-lg hover:bg-[#333] transition-colors group` |
| **Footer CTA (noir)** | `inline-block bg-[#1a1a1a] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#333] transition-colors` |
| **PromoBanner CTA** | `px-5 py-2 bg-[#e8eae4] text-[#1a1a1a] rounded-full font-medium text-sm hover:bg-white transition-colors tracking-wide inline-flex items-center gap-1.5` |

### Icônes dans les boutons

Flèche droite : `<i data-lucide="arrow-right" class="w-5 h-5 stroke-[1.5] group-hover:translate-x-1 transition-transform"></i>`

Flèche diagonal : `<i data-lucide="arrow-up-right" class="w-4 h-4 stroke-[1.5]"></i>`

### Thème sombre (PRINCE)

**Inchangé.** Voir [[Website-design-system ARCHIVE]] section 6.

---

## 7. Composants réutilisables identifiés

### Navbar (thème clair)

```
<Navbar />  ← fixed top-0, h-24, backdrop-blur, bg-[#f5f4f0]/80
```

Logo : SVG circulaire + texte "Mathieu" (gris, normal) / "KUNTZ" (noir, medium), tous deux `text-[10px] tracking-widest uppercase`.

Links desktop : 3 liens + 1 CTA pill noir "Me contacter".

Mobile : hamburger Lucide `menu` / `x`, overlay plein écran `bg-[#f5f4f0]`.

Script : toggle menu + navbar blur on scroll (déjà dans `MainLayout.astro`).

### PromoBanner (thème clair, conditionnel)

```
<PromoBanner />  ← fixed top-24, bg-[#1a1a1a], z-40
```

Affiché quand un spectacle est en cours. Lien vers `/prince`. Icône Lucide `ticket`.

### Hero (thème clair)

Structure : grille 12 colonnes (5 texte / 7 visuel).
- H1 grand avec `<br>` pour contrôle de ligne
- Subheadline dans un bloc `border-l-[1.5px] border-[#dcdacd] pl-6`
- CTA primaire olive
- Image circulaire (rounded-full, overflow, qui déborde)
- 3 badges flottants : écrous activités (lien), tampon rotatif olive, badge contact (lien)
- Stats bar en bas : `bg-[#e8eae4]` avec `rounded-tr-[120px]`, 3 colonnes

### Carte d'activité (thème clair)

```html
<div class="bg-[#f5f4f0] rounded-[32px] p-4 flex flex-col group transition-colors hover:shadow-xl hover:shadow-black/5 duration-500">
  <div class="w-full aspect-[4/3] rounded-[24px] overflow-hidden mb-6 bg-white">
    <img src="..." alt="..." class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
  </div>
  <div class="px-2 flex-grow flex flex-col">
    <h3 class="text-2xl font-medium tracking-tight text-[#1a1a1a] mb-3">Titre</h3>
    <p class="text-base text-[#5c5c5a] font-light leading-relaxed mb-6 flex-grow">Description</p>
    <a href="..." class="inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] uppercase text-[#1a1a1a] group-hover:text-[#5d674f] transition-colors mt-auto">
      Lien <i data-lucide="arrow-right" class="w-4 h-4 stroke-[1.5]"></i>
    </a>
  </div>
</div>
```

### Section "Qui je suis" (thème clair)

Structure : grille 2 colonnes (image + texte).
- Image `aspect-[4/5] rounded-3xl` avec cercle décoratif en bas-droite
- Kicker avec tiret (`w-8 h-[1px] bg-[#5d674f]`)
- H2 avec `<br>` pour contrôle de ligne
- Paragraphes `text-lg text-[#5c5c5a] font-normal leading-relaxed`
- Lien texte avec border-bottom

### Section Contact (thème clair)

Structure : centrée, `bg-[#e8eae4]`, `text-center`.
- Icône SVG soleil/décorative en `text-[#5d674f]`
- H2 grand "Écrivez-moi."
- Texte + email en bouton `mailto:` + Instagram

### Footer (thème clair)

Structure : 4 colonnes (brand, explorer, en ce moment, newsletter).
- `bg-[#f5f4f0]`, `border-t border-[#dcdacd]`
- Brand : logo SVG + nom + tagline
- Explorer : 3 liens internes
- En ce moment : PRINCE + CTA réserver
- Newsletter : input border-bottom + bouton flèche
- Bottom bar : copyright + liens légaux

---

## 8. Icônes (thème clair)

**Bibliothèque :** Lucide. Chargement via `<script src="https://unpkg.com/lucide@latest"></script>` dans `MainLayout.astro`.

Usage : `<i data-lucide="icon-name" class="w-5 h-5 stroke-[1.5]"></i>`

**Important :** `lucide.createIcons()` est appelé dans le script du layout. Après toute modification dynamique du DOM (ex: toggle menu), rappeler `lucide.createIcons()`.

Icônes utilisées sur la homepage :

| Icône Lucide | Usage |
|-------|-------|
| `menu` | bouton menu mobile |
| `x` | fermer menu mobile |
| `arrow-right` | CTA flèche droite (générique) |
| `arrow-up-right` | lien externe (Voir PRINCE) |
| `arrow-left` | navigation retour (template) |
| `ticket` | promo banner (spectacle) |
| `asterisk` | badge activités (hero) |
| `user` | stat "10 ans d'hypnose" |
| `heart` | stat "500+ personnes" |
| `flower-2` | stat "∞ manières" |
| `sun` | features (template) |
| `droplets` | features (template) |
| `users` | features (template) |
| `check` | pricing (template) |

**Règle :** rester dans la librairie Lucide pour le thème clair. `stroke-[1.5]` par défaut.

---

## 9. Liens internes

**Règle absolue :** tous les liens internes utilisent des chemins **absolus** commençant par `/` (pas de `#section` seul, pas de chemins relatifs).

| Cible | Lien |
|-------|------|
| Accueil | `/` |
| Section accueil | `/#activites`, `/#qui-je-suis`, `/#contact` |
| Page Prince | `/prince` |
| Section Prince | `/prince#experience`, `/prince#artiste`, etc. |
| Email | `mailto:mk@mathieukuntz.org` |

Les ancres `#` seules cassent la navigation inter-pages. Toujours préfixer avec la route.

---

## 10. Patterns de structure de page

### Page institutionnelle (thème clair)

```
<MainLayout title="..." description="...">
  <Navbar />          ← fixed top-0, h-24
  <PromoBanner />     ← fixed top-24 (conditionnel)
  <main class="pt-16">
    <Hero />          ← min-h-screen, grille 12 colonnes
    <Activites />     ← bg-white, cartes en grille 2 colonnes
    <QuiJeSuis />     ← bg-[#f5f4f0], grille 2 colonnes
    <Contact />       ← bg-[#e8eae4], centré
  </main>
  <Footer />
</MainLayout>
```

### Page de vente spectacle (thème sombre)

**Inchangé.** Voir [[Website-design-system ARCHIVE]] section 10.

```
<PrinceLayout title="..." description="...">
  <Navbar />          ← sticky, logo spectacle + CTA billet
  <Hero />            ← min-h-[90vh], grille 12 colonnes + teaser vidéo
  ...
  <Footer />
  <MobileCTABar />    ← sticky bottom mobile
</PrinceLayout>
```

---

## 11. Sections template archivées

Les sections suivantes ont été retirées de la homepage mais **conservées dans `src/components/main/`** pour réutilisation future :

| Composant | Section d'origine | Description |
|-----------|-------------------|-------------|
| `DiscoverFlow.astro` | "Discover your flow" | Scroll horizontal de cartes avec snap |
| `Schedule.astro` | "Upcoming Schedule" | Liste tabulaire avec tabs filtres |
| `Features.astro` | Bande verte olive | Grille 3 colonnes d'icônes + texte sur fond `#5d674f` |
| `Teachers.astro` | "Meet your guides" | Grille de portraits circulaires en grayscale |
| `Pricing.astro` | "Simple, transparent pricing" | 3 plans de prix avec toggle mensuel/annuel |
| `Gallery.astro` | Galerie d'images | 2 images plein écran côte à côte avec hover overlay |

Pour réutiliser ces sections dans une nouvelle page :
1. Importer le composant dans la page `.astro`
2. L'ajouter dans le `<main>` au bon endroit
3. Adapter le contenu

---

## 12. Règles de création de nouvelle page

1. **Choisir le thème** selon le type de page (clair = institutionnel, sombre = vente/immersif). Si doute, demander.
2. **Créer un dossier de composants** dans `src/components/[nom-page]/` (un composant par section).
3. **Créer la page** dans `src/pages/[route].astro` qui importe et assemble les composants dans le layout approprié.
4. **Respecter les espacements standards** (`py-24 md:py-40`, `max-w-screen-2xl mx-auto`, `gap-6`/`gap-12`).
5. **Liens internes en chemins absolus** (`/`, `/prince`, `/#section`).
6. **Icônes Lucide** pour le thème clair, **Iconify/Solar** pour le thème sombre. `stroke-[1.5]` par défaut.
7. **Tester le build** : `npm run build` avant de pousser.
8. **Push** : `git add -A && git commit -m "..." && git push origin main` (déploiement Cloudflare automatique).

---

## 13. Structure des fichiers

```
website-mathieukuntz-com/
├── Website-design-system.md          ← ce fichier
├── Website-design-system ARCHIVE.md  ← ancien design system (référence)
├── astro.config.mjs
├── package.json
├── functions/api/                    ← API serverless (Stripe, billetterie, emails)
├── src/
│   ├── styles/global.css             ← @import "tailwindcss";
│   ├── layouts/
│   │   ├── MainLayout.astro          ← thème clair (Inter, Lucide)
│   │   └── PrinceLayout.astro        ← thème sombre (Manrope, Cormorant, Solar)
│   ├── components/
│   │   ├── main/                     ← composants homepage (thème clair)
│   │   │   ├── Navbar.astro
│   │   │   ├── PromoBanner.astro
│   │   │   ├── Hero.astro
│   │   │   ├── Activites.astro
│   │   │   ├── QuiJeSuis.astro
│   │   │   ├── Contact.astro
│   │   │   ├── Footer.astro
│   │   │   ├── DiscoverFlow.astro    ← archivé (pas dans index.astro)
│   │   │   ├── Schedule.astro        ← archivé
│   │   │   ├── Features.astro        ← archivé
│   │   │   ├── Teachers.astro        ← archivé
│   │   │   ├── Pricing.astro         ← archivé
│   │   │   └── Gallery.astro         ← archivé
│   │   ├── prince/                   ← composants spectacle (thème sombre)
│   │   └── archive/old-main/         ← anciens composants homepage (avant juin 2026)
│   └── pages/
│       ├── index.astro               ← homepage
│       ├── prince.astro              ← page spectacle
│       └── prince/                   ← sous-pages spectacle (admin, checkout, etc.)
```
