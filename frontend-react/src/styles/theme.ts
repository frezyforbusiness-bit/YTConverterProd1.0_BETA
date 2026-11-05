/**
 * Design System - Theme Tokens
 * Producer Tools — Studio Edition
 */

export const theme = {
  colors: {
    // Background & Surfaces
    background: {
      primary: 'var(--color-bg-primary)',
      secondary: 'var(--color-bg-secondary)',
      card: 'var(--color-bg-card)',
      elevated: 'var(--color-bg-elevated)',
      gradient: 'linear-gradient(135deg, #f2f0e9, #faf9f5)',
    },

    // Accent Colors
    accent: {
      primary: 'var(--color-accent)',
      secondary: 'var(--color-accent-secondary)',
      border: 'var(--color-border)',
      focusRing: 'var(--color-focus)',
    },

    // Text Colors
    text: {
      primary: 'var(--color-text-primary)',
      secondary: 'var(--color-text-secondary)',
      muted: 'var(--color-text-muted)',
      gradient: 'linear-gradient(135deg, #e5e7eb 0%, #b83d1f 45%, #c64726 90%)',
    },

    // Status Colors
    status: {
      success: 'var(--color-success)',
      error: 'var(--color-error)',
      warning: 'var(--color-warning)',
      info: 'var(--color-info)',
    },
  },

  typography: {
    fonts: {
      heading: '"Manrope Variable", sans-serif',
      body: '"Manrope Variable", sans-serif',
      accent: '"Courier New", monospace',
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
      body: '1rem',
      small: '0.875rem',
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
    small: '3px',
    medium: '4px',
    large: '6px',
    xl: '8px',
    full: '9999px',
  },

  shadows: {
    none: 'none',
    sm: '0 4px 16px rgba(0, 0, 0, 0.12)',
    md: '0 8px 24px rgba(0, 0, 0, 0.16)',
    lg: '0 12px 32px rgba(0, 0, 0, 0.2)',
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

