const DEFAULT_COLOR = '#667eea';

export const styled = {
  div: (styles) => styles,
  button: (styles) => styles,
  input: (styles) => styles
};

export const keyframes = (_name, animation) => animation;

export const css = (styles) => styles;

const clamp = (value, min = 0, max = 255) => Math.min(Math.max(value, min), max);

const parseHexColor = (hex) => {
  const normalized = hex.replace('#', '').trim();
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(normalized)) {
    return null;
  }

  const expanded = normalized.length === 3
    ? normalized
        .split('')
        .map((char) => char + char)
        .join('')
    : normalized;

  const intVal = parseInt(expanded, 16);
  return {
    r: (intVal >> 16) & 255,
    g: (intVal >> 8) & 255,
    b: intVal & 255,
    a: 1,
    format: 'hex'
  };
};

const parseRgbColor = (value) => {
  const match = value
    .trim()
    .match(/^rgba?\((\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([01]?\.\d+|[01]))?\)$/i);

  if (!match) {
    return null;
  }

  const [, r, g, b, alpha] = match;
  return {
    r: clamp(Number(r)),
    g: clamp(Number(g)),
    b: clamp(Number(b)),
    a: typeof alpha === 'string' ? Math.min(Math.max(Number(alpha), 0), 1) : 1,
    format: 'rgb'
  };
};

const parseColor = (input) => {
  if (!input || typeof input !== 'string') {
    return parseHexColor(DEFAULT_COLOR);
  }

  const trimmed = input.trim();

  if (trimmed.startsWith('#')) {
    return parseHexColor(trimmed) ?? parseHexColor(DEFAULT_COLOR);
  }

  if (/^rgba?/i.test(trimmed)) {
    return parseRgbColor(trimmed) ?? parseHexColor(DEFAULT_COLOR);
  }

  return parseHexColor(DEFAULT_COLOR);
};

const componentToHex = (value) => value.toString(16).padStart(2, '0');

const rgbToHex = ({ r, g, b }) => `#${componentToHex(Math.round(r))}${componentToHex(Math.round(g))}${componentToHex(Math.round(b))}`;

const toRgbaString = ({ r, g, b, a = 1 }, alphaOverride) => {
  const alpha = typeof alphaOverride === 'number' ? alphaOverride : a;
  const normalizedAlpha = Math.min(Math.max(alpha ?? 1, 0), 1);
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Number(normalizedAlpha.toFixed(3))})`;
};

const adjustLuminance = (color, amount) => {
  const factor = Math.min(Math.max(amount, -1), 1);
  const { r, g, b, a } = color;

  const adjustChannel = (channel) => {
    if (factor >= 0) {
      return clamp(channel + (255 - channel) * factor);
    }
    return clamp(channel * (1 + factor));
  };

  return {
    r: adjustChannel(r),
    g: adjustChannel(g),
    b: adjustChannel(b),
    a
  };
};

const mixColors = (first, second, weight = 0.5) => {
  const w = Math.min(Math.max(weight, 0), 1);
  const complement = 1 - w;

  return {
    r: clamp(first.r * complement + second.r * w),
    g: clamp(first.g * complement + second.g * w),
    b: clamp(first.b * complement + second.b * w),
    a: (first.a ?? 1) * complement + (second.a ?? 1) * w
  };
};

const getLuminance = ({ r, g, b }) => {
  const toLinear = (channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

const getContrastColor = (color) => (getLuminance(color) > 0.55 ? '#1f2933' : '#ffffff');

const formatColor = (color) => (color.a != null && color.a < 0.999 ? toRgbaString(color) : rgbToHex(color));

const createColorVariation = (inputColor) => {
  const parsed = parseColor(inputColor);
  const base = parsed ?? parseColor(DEFAULT_COLOR);

  const lighten = (amount) => formatColor(adjustLuminance(base, Math.min(Math.max(amount, 0), 1)));
  const darken = (amount) => formatColor(adjustLuminance(base, -Math.min(Math.max(amount, 0), 1)));

  const lighter = lighten(0.2);
  const lightest = lighten(0.35);
  const darker = darken(0.18);
  const darkest = darken(0.35);
  const hover = getLuminance(base) > 0.55 ? darken(0.12) : lighten(0.12);
  const active = darken(0.22);

  const transparent = toRgbaString(base, 0.12);
  const semiTransparent = toRgbaString(base, 0.32);
  const subtle = toRgbaString(base, 0.2);
  const border = toRgbaString(base, 0.45);
  const shadow = toRgbaString(base, 0.28);
  const glow = toRgbaString(base, 0.55);

  const baseString = formatColor(base);
  const contrastText = getContrastColor(base);

  return {
    base: baseString,
    lighter,
    lightest,
    darker,
    darkest,
    hover,
    active,
    transparent,
    semiTransparent,
    subtle,
    border,
    outline: border,
    shadow,
    glow,
    gradient: `linear-gradient(135deg, ${lightest}, ${darker})`,
    contrastText,
    textOn: contrastText,
    rgba: (alpha = base.a ?? 1) => toRgbaString(base, alpha),
    withAlpha: (alpha) => toRgbaString(base, alpha),
    mix: (otherColor, weight = 0.5) => formatColor(mixColors(base, parseColor(otherColor) ?? base, weight)),
    lighten: (amount = 0.1) => lighten(amount),
    darken: (amount = 0.1) => darken(amount)
  };
};

export const colorVariations = (color) => {
  if (color && typeof color === 'object' && 'base' in color) {
    return { ...color };
  }

  return createColorVariation(typeof color === 'string' ? color : DEFAULT_COLOR);
};

export const colors = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#28a745',
  warning: '#f5a623',
  error: '#dc3545',
  info: '#17a2b8',
  text: '#1f2933',
  textSecondary: '#52606d',
  background: '#f7f9fc',
  surface: '#ffffff',
  border: '#d9e2ec',
  muted: '#9aa5b1',
  accent: '#ff6b6b'
};

const makeButtonVariant = (color) => {
  const palette = colorVariations(color);
  return {
    background: palette.gradient,
    color: palette.contrastText,
    border: `1px solid ${palette.border}`,
    shadow: palette.shadow,
    hover: {
      background: palette.hover,
      color: palette.contrastText,
      boxShadow: `0 10px 25px ${palette.semiTransparent}`
    },
    active: {
      background: palette.active,
      color: palette.contrastText,
      boxShadow: `0 6px 18px ${palette.shadow}`
    },
    focus: {
      outline: `3px solid ${palette.transparent}`,
      boxShadow: `0 0 0 4px ${palette.transparent}`
    }
  };
};

export const buttonStyles = {
  primary: makeButtonVariant(colors.primary),
  secondary: makeButtonVariant(colors.secondary),
  success: makeButtonVariant(colors.success),
  warning: makeButtonVariant(colors.warning),
  danger: makeButtonVariant(colors.error),
  info: makeButtonVariant(colors.info),
  ghost: {
    background: 'transparent',
    color: colors.text,
    border: `1px solid ${colorVariations(colors.text).transparent}`,
    hover: {
      background: colorVariations(colors.primary).transparent,
      color: colors.text
    },
    active: {
      background: colorVariations(colors.primary).semiTransparent,
      color: colors.text
    },
    focus: {
      outline: `2px solid ${colorVariations(colors.primary).transparent}`
    }
  }
};