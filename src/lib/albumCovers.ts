export function validAlbumCover(value: unknown): value is string {
  if (value === '≋') return true;
  if (typeof value !== 'string' || !value || value.length > 64) return false;
  const graphemes = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)];
  return graphemes.length === 1 && /[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u.test(value);
}

export function dominantCoverColor(pixels: ArrayLike<number>): string | null {
  const groups = new Map<string, { weight: number; r: number; g: number; b: number }>();
  for (let index = 0; index < pixels.length; index += 4) {
    const [r, g, b, alpha] = [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
    // Ignore transparent edges and neutral outlines/highlights of emoji artwork.
    if (alpha < 128 || Math.max(r, g, b) < 35 || Math.min(r, g, b) > 235) continue;
    const key = `${r >> 5},${g >> 5},${b >> 5}`;
    const group = groups.get(key) ?? { weight: 0, r: 0, g: 0, b: 0 };
    const weight = alpha / 255;
    group.weight += weight;
    group.r += r * weight;
    group.g += g * weight;
    group.b += b * weight;
    groups.set(key, group);
  }
  const dominant = [...groups.values()].sort((a, b) => b.weight - a.weight)[0];
  if (!dominant) return null;
  return '#' + [dominant.r, dominant.g, dominant.b].map(value => Math.round(value / dominant.weight).toString(16).padStart(2, '0')).join('');
}

export function emojiCoverColor(emoji: string): string | null {
  if (emoji === '≋') return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 96;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    context.font = '64px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(emoji, 48, 48);
    return dominantCoverColor(context.getImageData(0, 0, 96, 96).data);
  } catch { return null; }
}
