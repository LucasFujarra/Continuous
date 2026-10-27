export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const AUDIO_PATTERN = /\.(mp3|wav|ogg|aac|m4a|mp4|flac|opus|webm)$/i;
export type Track = { id: string; folder: string; name: string; url: string };
export type Mode = 'major' | 'minor';

export function normalizeName(filename: string) {
  const stem = filename.replace(/\.[^.]+$/, '').replace(/\s/g, '');
  if (/sus$/i.test(stem)) return stem.slice(0, -3).toUpperCase() + '#';
  return stem.charAt(0).toUpperCase() + stem.slice(1);
}

export function majorNote(name: string) {
  const match = /^([A-G]#?)(m)?$/.exec(name);
  if (!match || !NOTES.includes(match[1])) return name;
  return match[2] ? NOTES[(NOTES.indexOf(match[1]) + 3) % 12] : match[1];
}

export function displayName(name: string, mode: Mode) {
  const major = majorNote(name);
  const index = NOTES.indexOf(major);
  return mode === 'minor' && index >= 0 ? NOTES[(index + 9) % 12] + 'm' : major;
}

export function orderedTracks(tracks: Track[]) {
  const unique = new Map<string, Track>();
  for (const track of [...tracks].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!unique.has(majorNote(track.name))) unique.set(majorNote(track.name), track);
  }
  return [...unique.values()].sort((a, b) => {
    const ai = NOTES.indexOf(majorNote(a.name));
    const bi = NOTES.indexOf(majorNote(b.name));
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi) || a.name.localeCompare(b.name);
  });
}

