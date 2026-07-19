/**
 * Gyaan Design System Tokens
 *
 * Elegant, premium Linear/V0-inspired design tokens for light and dark modes.
 * Uses refined off-whites, slates, and brand teals.
 */

export const designTokens = {
  // Theme identification
  name: 'Gyaan Premium Design System',
  version: '1.0.0',

  // Color definitions (as OKLCH values for modern browsers)
  colors: {
    // Light mode tokens
    light: {
      background: 'oklch(0.99 0.003 240)', // Slate-tinted premium off-white (#f8fafc equivalent)
      foreground: 'oklch(0.18 0.015 240)', // Slate-900 (#0f172a equivalent)
      card: 'oklch(1 0 0)', // Pure white
      cardForeground: 'oklch(0.18 0.015 240)',
      popover: 'oklch(1 0 0)',
      popoverForeground: 'oklch(0.18 0.015 240)',
      primary: 'oklch(0.48 0.13 195)', // Refined brand teal (#0d9488)
      primaryForeground: 'oklch(0.99 0.003 240)',
      secondary: 'oklch(0.96 0.005 240)', // Slate-100 (#f1f5f9)
      secondaryForeground: 'oklch(0.18 0.015 240)',
      muted: 'oklch(0.96 0.005 240)',
      mutedForeground: 'oklch(0.55 0.015 240)', // Slate-500 (#64748b)
      accent: 'oklch(0.94 0.01 240)', // Slate-200 (#e2e8f0)
      accentForeground: 'oklch(0.18 0.015 240)',
      destructive: 'oklch(0.58 0.22 27)', // Destructive red
      destructiveForeground: 'oklch(0.985 0 0)',
      border: 'oklch(0.92 0.008 240)', // Subtle border slate-200
      borderSubtle: 'oklch(0.94 0.005 240 / 70%)', // Very faint 1px border
      input: 'oklch(0.92 0.008 240)',
      ring: 'oklch(0.48 0.13 195 / 40%)', // Soft focus teal ring
    },
    // Dark mode tokens
    dark: {
      background: 'oklch(0.09 0.005 240)', // Premium off-black deep slate (#030712 equivalent)
      foreground: 'oklch(0.93 0.005 240)', // Slate-100 (#f1f5f9 equivalent)
      card: 'oklch(0.12 0.01 240)', // Rich dark slate card (#0f111a equivalent)
      cardForeground: 'oklch(0.93 0.005 240)',
      popover: 'oklch(0.12 0.01 240)',
      popoverForeground: 'oklch(0.93 0.005 240)',
      primary: 'oklch(0.72 0.13 195)', // Luminous teal (#2dd4bf)
      primaryForeground: 'oklch(0.09 0.005 240)',
      secondary: 'oklch(0.18 0.015 240)', // Slate-800 (#1e293b)
      secondaryForeground: 'oklch(0.93 0.005 240)',
      muted: 'oklch(0.18 0.015 240)',
      mutedForeground: 'oklch(0.65 0.01 240)', // Slate-400 (#94a3b8)
      accent: 'oklch(0.24 0.015 240)', // Slate-700 (#334155)
      accentForeground: 'oklch(0.93 0.005 240)',
      destructive: 'oklch(0.45 0.18 27)',
      destructiveForeground: 'oklch(0.985 0 0)',
      border: 'oklch(0.24 0.015 240 / 80%)', // Dark border slate-800/80
      borderSubtle: 'oklch(0.24 0.015 240 / 40%)', // Very subtle slate border
      input: 'oklch(0.24 0.015 240 / 80%)',
      ring: 'oklch(0.72 0.13 195 / 50%)', // Luminous focus ring
    },
  },

  // Layouts and Effects
  layouts: {
    centeredRail: 'w-full max-w-(--centered-rail-max-width) mx-auto px-6 sm:px-8',
    subtleBorder: 'border border-(--border-subtle)',
    glassCard: {
      base: 'bg-(--glass-bg) backdrop-blur-xl border border-(--border-subtle) shadow-(--shadow-subtle)',
    },
  },

  // CSS Variable Mapping helpers
  cssVariables: {
    light: {
      '--background': 'oklch(0.99 0.003 240)',
      '--foreground': 'oklch(0.18 0.015 240)',
      '--card': 'oklch(1 0 0)',
      '--card-foreground': 'oklch(0.18 0.015 240)',
      '--popover': 'oklch(1 0 0)',
      '--popover-foreground': 'oklch(0.18 0.015 240)',
      '--primary': 'oklch(0.48 0.13 195)',
      '--primary-foreground': 'oklch(0.99 0.003 240)',
      '--secondary': 'oklch(0.96 0.005 240)',
      '--secondary-foreground': 'oklch(0.18 0.015 240)',
      '--muted': 'oklch(0.96 0.005 240)',
      '--muted-foreground': 'oklch(0.55 0.015 240)',
      '--accent': 'oklch(0.94 0.01 240)',
      '--accent-foreground': 'oklch(0.18 0.015 240)',
      '--destructive': 'oklch(0.58 0.22 27)',
      '--destructive-foreground': 'oklch(0.985 0 0)',
      '--border': 'oklch(0.92 0.008 240)',
      '--border-subtle': 'oklch(0.94 0.005 240 / 70%)',
      '--input': 'oklch(0.92 0.008 240)',
      '--ring': 'oklch(0.48 0.13 195 / 40%)',
      '--glass-bg': 'oklch(1 0 0 / 70%)',
      '--shadow-subtle': '0 1px 2px 0 oklch(0 0 0 / 0.03)',
      '--shadow-premium':
        '0 4px 12px 0 oklch(0.2 0.015 240 / 0.04), 0 0 0 1px oklch(0.94 0.005 240 / 70%)',
      '--shadow-overlay':
        '0 12px 24px -4px oklch(0.2 0.015 240 / 0.08), 0 4px 12px -2px oklch(0.2 0.015 240 / 0.04), 0 0 0 1px oklch(0.94 0.005 240 / 70%)',
    },
    dark: {
      '--background': 'oklch(0.09 0.005 240)',
      '--foreground': 'oklch(0.93 0.005 240)',
      '--card': 'oklch(0.12 0.01 240)',
      '--card-foreground': 'oklch(0.93 0.005 240)',
      '--popover': 'oklch(0.12 0.01 240)',
      '--popover-foreground': 'oklch(0.93 0.005 240)',
      '--primary': 'oklch(0.72 0.13 195)',
      '--primary-foreground': 'oklch(0.09 0.005 240)',
      '--secondary': 'oklch(0.18 0.015 240)',
      '--secondary-foreground': 'oklch(0.93 0.005 240)',
      '--muted': 'oklch(0.18 0.015 240)',
      '--muted-foreground': 'oklch(0.65 0.01 240)',
      '--accent': 'oklch(0.24 0.015 240)',
      '--accent-foreground': 'oklch(0.93 0.005 240)',
      '--destructive': 'oklch(0.45 0.18 27)',
      '--destructive-foreground': 'oklch(0.985 0 0)',
      '--border': 'oklch(0.24 0.015 240 / 80%)',
      '--border-subtle': 'oklch(0.24 0.015 240 / 40%)',
      '--input': 'oklch(0.24 0.015 240 / 80%)',
      '--ring': 'oklch(0.72 0.13 195 / 50%)',
      '--glass-bg': 'oklch(0.12 0.01 240 / 65%)',
      '--shadow-subtle': '0 1px 2px 0 oklch(0 0 0 / 0.1)',
      '--shadow-premium': '0 4px 12px 0 oklch(0 0 0 / 0.2), 0 0 0 1px oklch(0.24 0.015 240 / 40%)',
      '--shadow-overlay':
        '0 12px 24px -4px oklch(0 0 0 / 0.3), 0 4px 12px -2px oklch(0 0 0 / 0.2), 0 0 0 1px oklch(0.24 0.015 240 / 40%)',
    },
  },
} as const;
