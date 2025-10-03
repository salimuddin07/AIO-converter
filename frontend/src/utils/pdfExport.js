export const PAGE_SIZES_MM = {
  a4: { label: 'A4 (210 × 297 mm)', width: 210, height: 297 },
  letter: { label: 'Letter (216 × 279 mm)', width: 215.9, height: 279.4 },
  legal: { label: 'Legal (216 × 356 mm)', width: 215.9, height: 355.6 },
  a3: { label: 'A3 (297 × 420 mm)', width: 297, height: 420 }
};

export const mmToPoints = (mm) => (mm / 25.4) * 72;

export const clampMargin = (value) => {
  const numeric = Number.isFinite(value) ? value : 10;
  return Math.min(60, Math.max(0, numeric));
};

export const pageSizeToPoints = (pageKey, orientation = 'portrait') => {
  const size = PAGE_SIZES_MM[pageKey] || PAGE_SIZES_MM.a4;
  const width = mmToPoints(size.width);
  const height = mmToPoints(size.height);

  if (orientation === 'landscape') {
    return { width: height, height: width };
  }

  return { width, height };
};

export const hexToRgbUnit = (hex) => {
  if (!hex) {
    return { r: 1, g: 1, b: 1 };
  }
  const normalized = hex.replace('#', '').trim();
  if (!(normalized.length === 3 || normalized.length === 6)) {
    return { r: 1, g: 1, b: 1 };
  }

  const expand = normalized.length === 3
    ? normalized.split('').map((ch) => ch + ch).join('')
    : normalized;

  const intVal = parseInt(expand, 16);
  if (Number.isNaN(intVal)) {
    return { r: 1, g: 1, b: 1 };
  }

  const r = ((intVal >> 16) & 255) / 255;
  const g = ((intVal >> 8) & 255) / 255;
  const b = (intVal & 255) / 255;

  return { r, g, b };
};

export const sanitizeFileName = (name, extension = 'pdf') => {
  const safeName = (name || 'document')
    .toString()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_.]/gi, '')
    .replace(/-{2,}/g, '-');
  return `${safeName || 'document'}.${extension}`;
};
