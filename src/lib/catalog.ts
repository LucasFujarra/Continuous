import { AUDIO_PATTERN, normalizeName, type Track } from './library';

const bundled = import.meta.glob<string>('../assets/PAD/**/*', { query: '?url', import: 'default', eager: true });
export const bundledTracks: Track[] = Object.entries(bundled).filter(([path]) => AUDIO_PATTERN.test(path)).map(([path, url]) => {
  const relative = path.split('/PAD/')[1];
  const parts = relative.split('/');
  return { id: path, folder: parts.length > 1 ? parts.slice(0, -1).join(' / ') : 'Meus Pads', name: normalizeName(parts.at(-1)!), url };
});
