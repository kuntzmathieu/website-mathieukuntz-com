# Design System — Spectacles Mathieu Kuntz

## Colors

- **Background primary:** #0a0a0f (deep dark blue-black)
- **Background secondary:** #12121a (slightly lighter dark)
- **Background card:** #1a1a2e (card background)
- **Accent gold:** #c9a84c (warm gold)
- **Accent gold hover:** #dbb960 (lighter gold)
- **Accent warm:** #e8a849 (warm amber for highlights)
- **Text primary:** #f0ece2 (warm white)
- **Text secondary:** #a09b8c (muted warm gray)
- **Text accent:** #c9a84c (gold, same as accent)
- **Border:** #2a2a3e (subtle border)

## Typography

- **Heading font:** 'Playfair Display', Georgia, serif
- **Body font:** 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
- **Font sizes:**
  - Hero title: 3.5rem (mobile: 2.5rem)
  - Section title: 2rem
  - Card title: 1.5rem
  - Body: 1.125rem (18px)
  - Small: 0.875rem (14px)
  - CTA button: 1.125rem, bold

## Spacing

- Section padding: 5rem 0 (mobile: 3rem 0)
- Container max-width: 1200px
- Container padding: 0 1.5rem
- Card gap: 2rem
- Card padding: 2rem
- Button padding: 1rem 2.5rem

## Components

### Button CTA
- Background: c9a84c (gold)
- Text: 0a0a0f (dark)
- Border-radius: 4px
- Font: Inter, bold, uppercase, 0.9rem, letter-spacing 0.1em
- Hover: background dbb960, slight scale
- Transition: all 0.3s ease

### Card spectacle
- Background: 1a1a2e
- Border: 1px solid 2a2a3e
- Border-radius: 8px
- Padding: 2rem
- Hover: border-color c9a84c, translate-y -2px

### Section hero
- Min-height: 100vh (mobile: auto, min-height 80vh)
- Background: radial gradient (gold glow at 30% opacity, centered)
- Centered text
- Gradient fade to dark at bottom

### FAQ section
- Accordion style
- Question in gold, answer in text-secondary
- Border-bottom: 1px solid 2a2a3e

## Animations

- Fade-in on scroll (intersection observer)
- Hero text: subtle fade-up animation on load
- Cards: stagger fade-in
- Button: pulse glow on gold CTA

## Responsive

- Mobile-first
- Breakpoints: 768px (tablet), 1024px (desktop)
- Navigation: always visible (simple header)