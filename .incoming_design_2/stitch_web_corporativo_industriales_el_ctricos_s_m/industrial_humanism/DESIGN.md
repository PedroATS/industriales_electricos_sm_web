---
name: Industrial Humanism
colors:
  surface: '#111317'
  surface-dim: '#111317'
  surface-bright: '#37393d'
  surface-container-lowest: '#0c0e11'
  surface-container-low: '#1a1c1f'
  surface-container: '#1e2023'
  surface-container-high: '#282a2d'
  surface-container-highest: '#333538'
  on-surface: '#e2e2e6'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#e2e2e6'
  inverse-on-surface: '#2f3034'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#e9c349'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#ffdf9e'
  on-secondary: '#3f2e00'
  secondary-container: '#fabd00'
  on-secondary-container: '#6a4e00'
  tertiary: '#cdced7'
  on-tertiary: '#2d3037'
  tertiary-container: '#b1b3bb'
  on-tertiary-container: '#42454c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#ffdf9e'
  secondary-fixed-dim: '#fabd00'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5b4300'
  tertiary-fixed: '#e1e2ea'
  tertiary-fixed-dim: '#c4c6ce'
  on-tertiary-fixed: '#191c22'
  on-tertiary-fixed-variant: '#44474d'
  background: '#111317'
  on-background: '#e2e2e6'
  surface-variant: '#333538'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 72px
    fontWeight: '700'
    lineHeight: 80px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1440px
  gutter: 32px
  margin-desktop: 80px
  margin-tablet: 40px
  margin-mobile: 20px
  section-gap: 160px
---

## Brand & Style

This design system bridges the gap between industrial precision and human connection. It targets high-stakes B2B decision-makers who value reliability but seek a modern, approachable partnership. The visual narrative rejects the cold, sterile templates common in the sector, favoring a "Premium Industrial" aesthetic.

**Core Principles:**
- **Refined Precision:** Every line and spacing unit is deliberate, echoing the engineering excellence of the products.
- **Human Centricity:** Large-scale photography of people in action softens the technical nature of the content.
- **Organic Professionalism:** A blend of **Corporate Modern** structure with **Glassmorphism** and subtle organic gradients to create warmth without sacrificing authority.
- **Kinetic Elegance:** Movement is not decorative; it is a cue for progress, using smooth transitions and persistent navigation to provide a sense of stability.

## Colors

The palette is anchored in **Midnight Foundations** to establish a sense of permanence and depth. 

- **Primary (Metallic Gold):** Used for critical CTAs and brand accents. It should feel like high-grade brass or machined gold.
- **Secondary (Amber Glow):** A warmer, more vibrant yellow used for interactive states and data visualization to provide high-contrast readability against dark backgrounds.
- **Neutrals:** A range of deep charcoals (#1A1D23) and absolute blacks (#0D0F12) are used to create layers of depth.
- **Surface Gradients:** Use radial gradients sparingly (from #242830 to #0D0F12) to simulate natural light falling on matte industrial surfaces.

## Typography

The typographic system balances technicality with legibility. 

- **Headlines:** **Hanken Grotesk** provides a sharp, contemporary "engineered" feel. Use tight tracking on larger display sizes to create an impactful, editorial look.
- **Body:** **Manrope** offers high readability and a balanced, friendly tone for long-form technical descriptions.
- **Data & Labels:** **JetBrains Mono** is utilized for small metadata, industrial specs, and eyebrow headers to reinforce the B2B/Technical context.
- **Whitespace:** Maintain generous line-heights (1.5x - 1.6x for body text) to ensure content feels breathable and premium.

## Layout & Spacing

The system utilizes a **Fluid 12-Column Grid** with extreme vertical rhythm. 

- **Hero Sections:** Always 80vh to 100vh height, using high-quality immersive photography with a 40% midnight overlay for text legibility.
- **Section Gaps:** Large vertical gaps (160px+) are required to separate distinct product offerings or narratives, avoiding the "cluttered template" feel.
- **Persistent Navigation:** The header is fixed with a `backdrop-filter: blur(20px)` and a 1px border-bottom in a low-opacity gold (#D4AF3715). It should shrink slightly on scroll to maximize viewport space.
- **Asymmetric Elements:** Break the grid occasionally with floating images or offset text blocks to create an "organic" flow that feels human-curated.

## Elevation & Depth

Depth is conveyed through **Tonal Layering** and **Glassmorphism** rather than traditional heavy shadows.

- **Surface Levels:** The base is #0D0F12. Elevated cards use #1A1D23 with a 1px inner border (stroke) of #FFFFFF05.
- **Glass Effects:** Modals and navigation menus use a "Frosted Industrial" effect: semi-transparent charcoal with high saturation background blur.
- **Interactions:** On hover, elements should not just lift (shadow), but rather "glow." Use subtle outer glows with the Primary Gold color at 10-15% opacity to simulate light emitting from high-end machinery.
- **Entrances:** Elements should use "Slide + Fade" animations (duration: 0.8s, ease-out-expo) as the user scrolls into the viewport.

## Shapes

The shape language is **Soft (0.25rem)**. 

While the design is modern, it retains a structural "rectilinear" foundation to feel industrial. Fully rounded corners (pills) are avoided except for small status tags or chips. 

- **Primary Buttons:** Slightly rounded corners (4px) to feel solid and intentional.
- **Image Containers:** Should remain sharp or have a very subtle 4px radius to maintain a professional, architectural feel.
- **Decorative Elements:** Use thin 1px lines (vertical and horizontal) to act as "guides" or connectors between content blocks, mimicking technical drawings.

## Components

- **Persistent Navbar:** Fixed top. Includes a high-contrast "Request Quote" button in Primary Gold. Uses a smooth transition to a more compact state upon scrolling.
- **Primary Button:** Solid #D4AF37 background with #0D0F12 text. Hover state: #FFC107 with a subtle expansion animation.
- **Secondary Button:** Outlined with 1px #D4AF37. Transparent background.
- **Industrial Cards:** Used for services. Feature a large background image with a gradient overlay. Text is pinned to the bottom-left. On hover, the image scales slightly (1.05x).
- **Status Chips:** Using JetBrains Mono, these are small, all-caps labels with a subtle background tint (e.g., #D4AF3720) to categorize technical specs.
- **Input Fields:** Dark surfaces (#1A1D23) with 1px #FFFFFF20 borders. Focus state shifts the border to Primary Gold with a soft outer glow.
- **Scroll Progress Indicator:** A thin 2px gold line at the very top of the viewport to provide visual feedback for the smooth-scroll experience.