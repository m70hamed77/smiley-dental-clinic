/**
 * Figma Design System Integration
 * 
 * This file connects the project with Figma Design System
 * 
 * How to use:
 * 1. Open your Figma file
 * 2. Enable Dev Mode (Shift + D)
 * 3. Copy CSS/Design Tokens from Figma
 * 4. Update the values below
 */

export const figmaDesignTokens = {
  // 🎨 Colors - يجب نسخها من Figma
  colors: {
    // Primary Colors
    primary: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',  // Emerald-500
      600: '#059669',  // Emerald-600
      700: '#047857',  // Emerald-700
      800: '#065f46',
      900: '#064e3b',
    },
    
    // Secondary Colors
    secondary: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',  // Teal-500
      600: '#0d9488',  // Teal-600
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
    },
    
    // Semantic Colors
    success: {
      500: '#10b981',
      600: '#059669',
    },
    warning: {
      500: '#f59e0b',
      600: '#d97706',
    },
    error: {
      500: '#ef4444',
      600: '#dc2626',
    },
    info: {
      500: '#3b82f6',
      600: '#2563eb',
    },
    
    // Neutral Colors
    background: {
      DEFAULT: '#ffffff',
      dark: '#09090b',
    },
    foreground: {
      DEFAULT: '#18181b',
      dark: '#fafafa',
    },
    card: {
      DEFAULT: '#ffffff',
      dark: '#09090b',
    },
    muted: {
      DEFAULT: '#f4f4f5',
      dark: '#27272a',
    },
    border: {
      DEFAULT: '#e4e4e7',
      dark: '#27272a',
    },
  },

  // 📏 Spacing - يجب نسخها من Figma
  spacing: {
    0: '0px',
    1: '4px',    // xs
    2: '8px',    // sm
    3: '12px',
    4: '16px',   // md
    5: '20px',
    6: '24px',   // lg
    8: '32px',   // xl
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
  },

  // 🔳 Border Radius - يجب نسخها من Figma
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },

  // 📝 Typography - يجب نسخها من Figma
  fontSize: {
    xs: ['12px', { lineHeight: '16px' }],
    sm: ['14px', { lineHeight: '20px' }],
    base: ['16px', { lineHeight: '24px' }],
    lg: ['18px', { lineHeight: '28px' }],
    xl: ['20px', { lineHeight: '28px' }],
    '2xl': ['24px', { lineHeight: '32px' }],
    '3xl': ['30px', { lineHeight: '36px' }],
    '4xl': ['36px', { lineHeight: '40px' }],
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // 🔘 Shadows - يجب نسخها من Figma
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },

  // ⏱️ Transitions
  transitionDuration: {
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
  },
}

/**
 * Figma File Links
 * استبدل هذه الروابط بروابط ملف Figma الخاص بك
 */
export const figmaLinks = {
  file: 'https://www.figma.com/file/YOUR-FILE-ID',
  prototype: 'https://www.figma.com/proto/YOUR-FILE-ID',
  components: {
    buttons: 'https://www.figma.com/file/YOUR-FILE-ID?node-id=BUTTONS',
    cards: 'https://www.figma.com/file/YOUR-FILE-ID?node-id=CARDS',
    forms: 'https://www.figma.com/file/YOUR-FILE-ID?node-id=FORMS',
    navigation: 'https://www.figma.com/file/YOUR-FILE-ID?node-id=NAV',
  },
}

/**
 * Component Mapping to Figma
 * هذا يساعدك في معرفة أي مكون يتوافق مع أي عنصر في Figma
 */
export const figmaComponentMapping = {
  'Button': {
    figmaNode: 'Buttons / Primary',
    figmaLink: figmaLinks.components.buttons,
    usage: 'للأزرار الرئيسية في الصفحة',
  },
  'Card': {
    figmaNode: 'Cards / Default',
    figmaLink: figmaLinks.components.cards,
    usage: 'لعرض المعلومات في بطاقات',
  },
  'Input': {
    figmaNode: 'Forms / Input',
    figmaLink: figmaLinks.components.forms,
    usage: 'لإدخال البيانات',
  },
  'Navigation': {
    figmaNode: 'Navigation / Header',
    figmaLink: figmaLinks.components.navigation,
    usage: 'للقائمة العلوية',
  },
}

/**
 * Helper: Get Figma Link for a Component
 */
export function getFigmaLink(componentName: string): string {
  const component = figmaComponentMapping[componentName as keyof typeof figmaComponentMapping]
  return component?.figmaLink || figmaLinks.file
}

/**
 * Helper: Export Component to Figma (Comment)
 * أضف هذا كـ comment فوق كل مكون للإشارة للعنصر المقابل في Figma
 */
export const figmaComment = (nodeName: string) => 
  `// Figma: ${nodeName} | See: ${figmaLinks.file}`
