# Rawkode Academy Marketing Website

A modern, partnership-focused marketing website built with Astro, Vue, and Ark UI.

## Tech Stack

- **Framework:** Astro 5.15
- **UI Components:** Vue 3.5 + Ark UI 4.9
- **Styling:** Tailwind CSS 4.1
- **Deployment:** Cloudflare Pages
- **Package Manager:** Bun
- **Linting:** Biome

## Project Structure

```
.
├── src/
│   ├── components/
│   │   ├── common/           # Shared components (Button, Card, PageHero)
│   │   ├── partnership/      # Partnership-specific components
│   │   ├── testimonial/      # Testimonial components
│   │   └── faq/              # FAQ components
│   ├── layouts/
│   │   └── BaseLayout.astro  # Main layout with nav and footer
│   ├── pages/
│   │   ├── index.astro       # Homepage
│   │   ├── partnerships/     # Partnership programme
│   │   ├── training/         # Training programmes
│   │   ├── consulting/       # Consulting services
│   │   ├── about/            # About page
│   │   └── contact/          # Contact form
│   └── styles/
│       └── global.css        # Global styles and Tailwind imports
├── public/                   # Static assets
├── astro.config.mjs          # Astro configuration
├── wrangler.jsonc            # Cloudflare Workers configuration
├── biome.json                # Biome linter configuration
└── package.json              # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Bun 1.3+
- Node.js 22+ (for compatibility)

### Installation

```bash
bun install
```

### Development

```bash
bun run dev
```

The site will be available at `http://localhost:4321`

### Building

```bash
bun run build
```

### Preview

```bash
bun run preview
```

### Type Checking

```bash
bun run check
```

### Linting & Formatting

```bash
bun run lint
bun run format
```

## Deployment

This site is configured for deployment to Cloudflare Pages.

### Cloudflare Pages Setup

1. Connect your repository to Cloudflare Pages
2. Configure build settings:
	- **Build command:** `bun run build`
	- **Build output directory:** `dist`
	- **Root directory:** `projects/rawkode.academy/websites/marketing`

### Environment Variables

The site uses static generation and doesn't require environment variables for basic functionality.

For the contact form, update the form action in `src/pages/contact/index.astro` with your preferred form service (Formspree, Netlify Forms, etc.).

## Features

### Homepage
- Partnership-focused hero section
- Value proposition cards
- Current partners showcase
- Services overview
- Call-to-action sections

### Partnerships Page
- Four pricing tiers (Nip, Dram, Blend, Malt)
- Feature comparison
- Benefits breakdown
- Performance analytics

### Training Page
- Six training programmes
- Three delivery options
- Training process workflow

### Consulting Page
- Four service offerings
- Three engagement models
- Approach methodology

### About Page
- Mission and values
- Founder information
- Community stats

### Contact Page
- Lead capture form
- Contact information
- FAQ section

## Design System

### Colors
- Primary: Blue (600, 700)
- Background: Neutral (950, 900)
- Text: Neutral (50, 300, 400)
- Accent: Purple (for gradients)

### Typography
- Default system font stack
- Headings: Bold, tracking-tight
- Body: Regular, antialiased

### Components
All components are built with Vue 3 Composition API and Tailwind CSS.

## Contributing

When making changes:

1. Follow the `.editorconfig` settings
2. Run `bun run format` before committing
3. Run `bun run check` to ensure type safety
4. Test responsive design on mobile, tablet, and desktop

## Commit Convention

This project follows conventional commits:

```
type(scope): description

Examples:
- feat(rawkode.academy/marketing): add partnership tiers
- fix(rawkode.academy/marketing): correct pricing display
- chore(rawkode.academy/marketing): update dependencies
```

## License

Copyright © 2025 Rawkode Academy. All rights reserved.
