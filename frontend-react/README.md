# Producer Tools 2.0 - React Frontend

Modern React SPA built with Vite, featuring optimized performance, smooth animations, and a beautiful dark theme design system.

## Features

- ⚡ **Ultra-fast** - Built with Vite for instant HMR and optimized builds
- 🎨 **Modern Design** - Dark theme with glass morphism effects
- 🎭 **Smooth Animations** - Framer Motion powered transitions
- 📱 **Responsive** - Mobile-first design with touch optimizations
- ♿ **Accessible** - WCAG compliant with keyboard navigation
- 🚀 **Optimized** - Code splitting, lazy loading, GPU-accelerated animations

## Tech Stack

- **React 19** - Latest React with Concurrent Features
- **TypeScript** - Type-safe development
- **Vite** - Next-generation build tool
- **React Router v7** - Client-side routing
- **Framer Motion** - Animation library
- **Styled Components** - CSS-in-JS with theme support

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Layout/      # Layout components (Navbar, Footer)
│   ├── UI/          # Base UI components (Button, Input, Card, etc.)
│   └── common/      # Common components (LoadingSpinner, ErrorBoundary)
├── views/           # Page components (Home, Converter, MixMaster)
├── hooks/           # Custom React hooks
├── services/        # API services
├── context/         # React Context providers
├── styles/          # Global styles and theme
└── utils/           # Utility functions
```

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

## Design System

The app uses a comprehensive design system with:
- Color palette (dark theme optimized)
- Typography scale (responsive)
- Spacing system (modular 8px base)
- Animation variants (reusable)
- Component variants (consistent patterns)

## Performance Optimizations

- Code splitting with manual chunks
- Lazy loading for routes
- GPU-accelerated animations
- Optimized bundle size
- Reduced motion support

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
