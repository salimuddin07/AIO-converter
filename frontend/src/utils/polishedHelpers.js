// Advanced styling utilities using Polished library
import { 
  rgba, 
  lighten, 
  darken, 
  complement, 
  mix, 
  modularScale,
  transitions,
  animation,
  borderRadius,
  hiDPI,
  fluidRange,
  normalize,
  ellipsis,
  clearFix
} from 'polished';

// Color palette with professional variations
export const colors = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#388e3c',
  warning: '#f57c00',
  error: '#d32f2f',
  info: '#0288d1',
  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#212121',
  textSecondary: '#757575',
  border: '#e0e0e0'
};

// Generate color variations using Polished
export const colorVariations = (baseColor) => ({
  lightest: lighten(0.4, baseColor),
  lighter: lighten(0.2, baseColor),
  base: baseColor,
  darker: darken(0.1, baseColor),
  darkest: darken(0.2, baseColor),
  transparent: rgba(baseColor, 0.1),
  semiTransparent: rgba(baseColor, 0.5),
  complement: complement(baseColor),
  mixed: mix(0.5, baseColor, colors.background)
});

// Typography scale using modular scale
export const typography = {
  scale: (step) => modularScale(step, '16px', 1.25),
  sizes: {
    xs: modularScale(-2, '16px', 1.25),
    sm: modularScale(-1, '16px', 1.25),
    base: modularScale(0, '16px', 1.25),
    lg: modularScale(1, '16px', 1.25),
    xl: modularScale(2, '16px', 1.25),
    xxl: modularScale(3, '16px', 1.25),
    xxxl: modularScale(4, '16px', 1.25)
  }
};

// Professional shadows and effects
export const shadows = {
  light: `0 1px 3px ${rgba(colors.text, 0.12)}, 0 1px 2px ${rgba(colors.text, 0.24)}`,
  medium: `0 3px 6px ${rgba(colors.text, 0.16)}, 0 3px 6px ${rgba(colors.text, 0.23)}`,
  heavy: `0 10px 20px ${rgba(colors.text, 0.19)}, 0 6px 6px ${rgba(colors.text, 0.23)}`,
  inset: `inset 0 1px 3px ${rgba(colors.text, 0.2)}`,
  glow: (color) => `0 0 20px ${rgba(color, 0.5)}`
};

// Responsive breakpoints with fluid ranges
export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1200px'
};

export const fluidTypography = (minSize, maxSize, minScreen = breakpoints.mobile, maxScreen = breakpoints.desktop) => 
  fluidRange({
    prop: 'font-size',
    fromSize: minSize,
    toSize: maxSize
  }, minScreen, maxScreen);

// Animation presets
export const animations = {
  fadeIn: animation(['fadeIn'], '0.3s ease-in-out'),
  slideUp: animation(['slideInUp'], '0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'),
  bounce: animation(['bounce'], '1s ease-in-out'),
  pulse: animation(['pulse'], '2s infinite'),
  spin: animation(['spin'], '1s linear infinite'),
  zoomIn: animation(['zoomIn'], '0.3s ease-out')
};

// Transition presets
export const transitionPresets = {
  fast: transitions(['all'], '0.15s ease-in-out'),
  normal: transitions(['all'], '0.3s ease-in-out'),
  slow: transitions(['all'], '0.5s ease-in-out'),
  smooth: transitions(['all'], '0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'),
  bounce: transitions(['all'], '0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)')
};

// Border radius presets
export const borderRadii = {
  none: '0',
  sm: borderRadius('4px'),
  base: borderRadius('8px'),
  lg: borderRadius('12px'),
  xl: borderRadius('16px'),
  full: borderRadius('50%')
};

// Professional button styles
export const buttonStyles = {
  base: `
    ${transitionPresets.normal}
    ${borderRadii.base}
    padding: 12px 24px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  `,
  primary: `
    background: linear-gradient(135deg, ${colors.primary}, ${darken(0.1, colors.primary)});
    color: white;
    box-shadow: ${shadows.medium};
    &:hover {
      background: linear-gradient(135deg, ${lighten(0.05, colors.primary)}, ${colors.primary});
      transform: translateY(-2px);
      box-shadow: ${shadows.heavy};
    }
  `,
  secondary: `
    background: linear-gradient(135deg, ${colors.secondary}, ${darken(0.1, colors.secondary)});
    color: white;
    box-shadow: ${shadows.medium};
    &:hover {
      background: linear-gradient(135deg, ${lighten(0.05, colors.secondary)}, ${colors.secondary});
      transform: translateY(-2px);
      box-shadow: ${shadows.heavy};
    }
  `,
  outline: `
    background: transparent;
    border: 2px solid ${colors.primary};
    color: ${colors.primary};
    &:hover {
      background: ${colors.primary};
      color: white;
      box-shadow: ${shadows.medium};
    }
  `
};

// Card styles
export const cardStyles = {
  base: `
    background: ${colors.surface};
    ${borderRadii.lg}
    box-shadow: ${shadows.light};
    ${transitionPresets.normal}
    &:hover {
      box-shadow: ${shadows.medium};
      transform: translateY(-4px);
    }
  `,
  elevated: `
    background: ${colors.surface};
    ${borderRadii.lg}
    box-shadow: ${shadows.heavy};
  `
};

// Form input styles
export const inputStyles = {
  base: `
    ${borderRadii.base}
    border: 2px solid ${colors.border};
    padding: 12px 16px;
    ${transitionPresets.normal}
    background: ${colors.surface};
    font-size: ${typography.sizes.base};
    &:focus {
      border-color: ${colors.primary};
      box-shadow: 0 0 0 3px ${rgba(colors.primary, 0.1)};
      outline: none;
    }
    &:hover {
      border-color: ${darken(0.1, colors.border)};
    }
  `,
  error: `
    border-color: ${colors.error};
    &:focus {
      border-color: ${colors.error};
      box-shadow: 0 0 0 3px ${rgba(colors.error, 0.1)};
    }
  `
};

// Utility mixins
export const utilities = {
  centerContent: `
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  absoluteCenter: `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  `,
  truncateText: ellipsis(),
  clearfix: clearFix(),
  normalize: normalize(),
  hiDPI: hiDPI(1.5)
};

// Glass morphism effect
export const glassMorphism = (blur = '10px', opacity = 0.25) => `
  background: ${rgba(colors.surface, opacity)};
  backdrop-filter: blur(${blur});
  -webkit-backdrop-filter: blur(${blur});
  border: 1px solid ${rgba(colors.border, 0.18)};
`;

// Progress bar styles
export const progressBar = {
  track: `
    width: 100%;
    height: 8px;
    background: ${colors.border};
    ${borderRadii.full}
    overflow: hidden;
  `,
  fill: (progress, color = colors.primary) => `
    height: 100%;
    background: linear-gradient(90deg, ${color}, ${lighten(0.1, color)});
    width: ${progress}%;
    ${transitionPresets.smooth}
    ${borderRadii.full}
  `
};

export default {
  colors,
  colorVariations,
  typography,
  shadows,
  breakpoints,
  fluidTypography,
  animations,
  transitionPresets,
  borderRadii,
  buttonStyles,
  cardStyles,
  inputStyles,
  utilities,
  glassMorphism,
  progressBar
};
