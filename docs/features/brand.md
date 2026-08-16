# Brand Feature

Logo component and static SVG asset used across the application.

## Asset

| File | Purpose |
|------|---------|
| `public/logo.svg` | Primary brand asset — served at `/logo.svg`; used as favicon and logo `<img>` source |
| `index.html` | References `/logo.svg` as `<link rel="icon" type="image/svg+xml">` |

**SVG spec:** 1024 x 1024 viewBox, transparent background, vector ResearchTrack mark.

---

## Components (`src/components/brand/Logo.tsx`)

### `LogoMark`

Renders the logo mark at a given square size.

```tsx
import { LogoMark } from '@/components/brand/Logo';

<LogoMark size={40} />                          // default
<LogoMark size={28} className="opacity-80" />   // nav bar
<LogoMark size={52} />                          // auth pages
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | `40` | Square size in px |
| `className` | `string` | — | Additional Tailwind classes |

### `Logo`

Renders `LogoMark` with an optional wordmark beside it.

```tsx
import { Logo } from '@/components/brand/Logo';

<Logo size={40} showWordmark />     // mark + "ResearchTrack" text
<Logo size={32} />                  // mark only (same as <LogoMark>)
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | `40` | Height of the mark in px |
| `showWordmark` | `boolean` | `false` | Renders "ResearchTrack" text beside the mark |
| `className` | `string` | — | Applied to the wrapping `<span>` |

---

## Usage by Feature

| Location | Component | Size |
|----------|-----------|------|
| `TopBar` (public + private) | `Logo` | `38` |
| `HeroSection` | `LogoMark` | larger decorative hero usage |
| `LoginPage` | `LogoMark` wrapped in `<Link to="/">` | `52` |
| `RegisterPage` | `LogoMark` wrapped in `<Link to="/">` | `52` |
| `index.html` | Static `/logo.svg` | favicon |

Clicking the logo in the top bar and auth pages navigates back to the appropriate route.
