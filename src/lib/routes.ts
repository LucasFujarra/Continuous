import { displayName, orderedTracks, type Mode, type Track } from './library.ts';

export function slug(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/#/g, '-sharp').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'album';
}

export function albumSlug(folder: string, folders: string[]): string {
  const matching = folders.filter(item => slug(item) === slug(folder));
  return matching.length > 1 ? `${slug(folder)}-${matching.indexOf(folder) + 1}` : slug(folder);
}

export function padPath(folder: string, folders: string[], track?: Track, mode: Mode = 'major'): string {
  const base = `/pad/${albumSlug(folder, folders)}`;
  return track ? `${base}/${slug(displayName(track.name, mode))}` : base;
}

export interface PadRoute {
  folder: string;
  track: Track | null;
  mode: Mode;
}

export function resolvePadRoute(path: string, folders: string[], tracks: Track[]): PadRoute | null {
  let parts: string[];
  try { parts = decodeURIComponent(path).replace(/\/$/, '').split('/'); } catch { return null; }
  if (parts[1] !== 'pad' || parts.length < 3 || parts.length > 4 || !parts[2]) return null;
  const folder = folders.find(item => albumSlug(item, folders) === parts[2].toLowerCase());
  if (!folder) return null;
  if (parts.length === 3) return { folder, track: null, mode: 'major' };
  if (!parts[3]) return null;
  const tone = parts[3].toLowerCase().replace(/#/g, '-sharp');
  const available = orderedTracks(tracks.filter(track => track.folder === folder));
  for (const mode of ['major', 'minor'] as const) {
    const track = available.find(item => slug(displayName(item.name, mode)) === tone);
    if (track) return { folder, track, mode };
  }
  return null;
}
