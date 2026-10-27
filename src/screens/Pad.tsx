import { displayName, type Mode, type Track } from '../lib/library';

interface PadProps {
  tracks: Track[];
  mode: Mode;
  activeId: string | null;
  loadingId: string | null;
  selectedId: string | null;
  onHome: () => void;
  onMode: (mode: Mode) => void;
  onPlay: (track: Track) => void;
}

export function Pad({ tracks, mode, activeId, loadingId, selectedId, onHome, onMode, onPlay }: PadProps) {
  return <section className="library" aria-label="Tonalidades do álbum">
    <div className="section-heading">
      <div><button className="back" onClick={onHome}>← Voltar</button><span>TONALIDADES</span><span className="count">{tracks.length}</span></div>
      <div className="segmented" aria-label="Modo tonal"><button aria-pressed={mode === 'major'} onClick={() => onMode('major')}>Maior</button><button aria-pressed={mode === 'minor'} onClick={() => onMode('minor')}>Menor</button></div>
    </div>
    <div className="notes-grid">{tracks.map((track, index) => <button key={track.id} className={`note-card${activeId === track.id ? ' playing' : ''}${selectedId === track.id ? ' selected' : ''}`} aria-pressed={activeId === track.id} aria-current={selectedId === track.id ? 'true' : undefined} onClick={() => onPlay(track)}>
      <span className="card-index">{String(index + 1).padStart(2, '0')}</span><strong>{displayName(track.name, mode).replace('#', '♯')}</strong><span className="note-caption">{loadingId === track.id ? 'Carregando…' : activeId === track.id ? '● Tocando' : mode === 'major' ? 'MAIOR' : 'MENOR'}</span>
    </button>)}</div>
  </section>;
}
