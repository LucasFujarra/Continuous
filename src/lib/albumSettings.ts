import { validAlbumCover } from './albumCovers.ts';

export interface AlbumSettings { title?: string; color?: string; cover?: string }
export type AlbumPreferences = Record<string, AlbumSettings>;

export function hsvToHex(hue: number, saturation: number, value: number): string {
  const channel = (offset: number) => {
    const k = (offset + hue / 60) % 6;
    return Math.round(255 * value * (1 - saturation * Math.max(0, Math.min(k, 4 - k, 1)))).toString(16).padStart(2, '0');
  };
  return `#${channel(5)}${channel(3)}${channel(1)}`;
}

export function hexToHsv(hex: string) {
  const [r, g, b] = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  const hue = delta === 0 ? 0 : max === r ? ((g - b) / delta + 6) % 6 * 60 : max === g ? ((b - r) / delta + 2) * 60 : ((r - g) / delta + 4) * 60;
  return { hue, saturation: max === 0 ? 0 : delta / max, value: max };
}

export function defaultAlbumColor(index: number): string {
  // Match the original card palette (HSL 65% 70%).
  const hue = 160 + Math.max(0, index) * 35;
  return hsvToHex(hue % 360, 0.39 / 0.895, 0.895);
}

export function loadAlbumPreferences(): AlbumPreferences {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem('continuous-albums') ?? '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const settings: AlbumPreferences = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!value || typeof value !== 'object') continue;
      const item = value as AlbumSettings;
      settings[key] = {
        title: typeof item.title === 'string' && item.title.trim() ? item.title : undefined,
        cover: validAlbumCover(item.cover) ? item.cover : undefined,
        color: typeof item.color === 'string' && /^#[0-9a-f]{6}$/i.test(item.color) ? item.color : undefined,
      };
    }
    return settings;
  } catch { return {}; }
}

export function colorLuminance(hex: string): number {
  const channels = [1, 3, 5].map(index => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function contrastingText(hex: string): string {
  const luminance = colorLuminance(hex);
  const whiteContrast = 1.05 / (luminance + 0.05);
  const blackContrast = (luminance + 0.05) / 0.05;
  return whiteContrast > blackContrast ? '#ffffff' : '#000000';
}
