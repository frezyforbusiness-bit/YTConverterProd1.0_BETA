/**
 * Design System - Theme Tokens
 * Producer Tools 2.0 - Modern Dark Theme
 */

export const theme = {
  colors: {
    // Background & Surfaces
    background: {
      primary: '#0a0a0a',
      secondary: '#1a1a1a',
      card: 'rgba(30, 30, 30, 0.95)',
      elevated: 'rgba(40, 40, 40, 0.98)',
      gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
    },

    // Accent Colors
    accent: {
      primary: '#22c55e',
      secondary: '#f97316',
      border: 'rgba(148, 163, 184, 0.35)',
      focusRing: 'rgba(34, 197, 94, 0.4)',
    },

    // Text Colors
    text: {
      primary: '#f9fafb',
      secondary: '#e5e7eb',
      muted: '#9ca3af',
      gradient: 'linear-gradient(135deg, #e5e7eb 0%, #22c55e 45%, #f97316 90%)',
    },

    // Status Colors
    status: {
      success: '#4ade80',
      error: '#f87171',
      warning: '#ffd93d',
      info: '#60a5fa',
    },
  },

  typography: {
    fonts: {
      heading: "'Orbitron', sans-serif",
      body: "'Rajdhani', sans-serif",
      accent: "'Exo 2', sans-serif",
    },
    weights: {
      regular: 400,
      semibold: 600,
      bold: 700,
      black: 900,
    },
    sizes: {
      h1: 'clamp(2.5rem, 5vw, 4rem)',
      h2: 'clamp(1.75rem, 4vw, 2.5rem)',
      h3: 'clamp(1.25rem, 3vw, 1.75rem)',
      body: 'clamp(0.9rem, 2vw, 1.1rem)',
      small: 'clamp(0.8rem, 1.5vw, 1rem)',
    },
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  borderRadius: {
    small: '8px',
    medium: '12px',
    large: '16px',
    xl: '24px',
    full: '9999px',
  },

  shadows: {
    none: 'none',
    sm: '0 2px 8px rgba(0, 0, 0, 0.4)',
    md: '0 4px 16px rgba(0, 0, 0, 0.5)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.6)',
    xl: '0 16px 64px rgba(0, 0, 0, 0.7)',
    glow: '0 0 20px rgba(154, 154, 154, 0.2)',
  },

  transitions: {
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',
    slower: '600ms',
    easing: {
      smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      material: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  breakpoints: {
    mobile: '640px',
    tablet: '1024px',
    desktop: '1280px',
  },

  zIndex: {
    base: 1,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;

export type Theme = typeof theme;

