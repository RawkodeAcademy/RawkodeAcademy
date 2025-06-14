# Design Tokens

This directory contains the design tokens for the Rawkode Academy design system, implementing a token-driven approach to maintain visual consistency across the website.

## Architecture

The token system follows a two-tier architecture:

1. **Global tokens** - Raw values (colors, spacing, typography scales)
2. **Semantic tokens** - Contextual mappings that reference global tokens

## Files

- `rawkode.json` - Master token definitions
- `README.md` - This documentation

## Token Categories

### Colors
- Primary colors (`pink-500`, `pink-600`)
- Neutral colors (`gray-50`, `gray-900`)
- Accent colors (`accent-blue`)

### Typography
- Font families for body text and monospace
- Consistent with "developer-personal" brand voice

### Spacing
- 8pt base grid system (0, 0.25rem, 0.5rem, 0.75rem, 1rem, 1.5rem, 2rem, 3rem)
- Ensures consistent vertical and horizontal rhythm

### Border Radius
- Small (4px) and medium (8px) values
- Maintains subtle, developer-friendly aesthetic

### Shadows
- Minimal elevation system
- Subtle shadows that don't overpower content

### Motion
- Fast (150ms) for hovers
- Base (250ms) for transitions
- Respects `prefers-reduced-motion`

## Build Process

Tokens are transformed using Style Dictionary:

```bash
bun run tokens:build
```

This generates:
- `src/styles/tokens.css` - CSS custom properties
- `src/lib/tokens.js` - JavaScript token exports
- `src/lib/tailwind-tokens.js` - Tailwind configuration

## Usage

### In CSS
```css
.component {
  color: var(--rk-semantic-color-primary);
  padding: var(--rk-global-spacing-4);
  border-radius: var(--rk-global-radius-md);
}
```

### In Tailwind
Use the extended theme values or CSS variables:
```html
<div class="bg-primary text-white p-4 rounded-md">
  Content
</div>
```

### In JavaScript
```javascript
import tokens from '@/lib/tokens.js';

const primaryColor = tokens.global.color['pink-500'].value;
```

## Design Principles

1. **Developer-personal** - Subtle, code-editor aesthetics
2. **Trust over polish** - Authentic feel over marketing polish  
3. **Accessible by default** - WCAG AA contrast ratios
4. **Composable** - All patterns built from tokens

## Contributing

When adding new tokens:

1. Add to appropriate section in `rawkode.json`
2. Run `bun run tokens:build` to generate outputs
3. Update components to use new tokens
4. Test accessibility compliance
5. Document usage patterns

## Figma Integration

Import `rawkode.json` into Figma using Tokens Studio plugin to maintain design-dev parity.