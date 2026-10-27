import type { CSSProperties } from 'react';
import { orderedTracks, type Track } from '../lib/library';

interface HomeProps {
  folders: string[];
  tracks: Track[];
  restoring: boolean;
  protectedFolders: Set<string>;
  albumTitle: (folder: string) => string;
  albumColor: (folder: string) => string;
  onOpen: (folder: string) => void;
  onEdit: (folder: string) => void;
  onDelete: (folder: string) => void;
  onUpload: () => void;
}

export function Home({ folders, tracks, restoring, protectedFolders, albumTitle, albumColor, onOpen, onEdit, onDelete, onUpload }: HomeProps) {
  return <section className="library" aria-label="Biblioteca de pads">
    <div className="section-heading"><div><span>BIBLIOTECA</span><span className="count">{folders.length}</span></div></div>
    {restoring && <p role="status">Restaurando álbuns…</p>}
    {!folders.length && !restoring ? <div className="empty">
      <div className="empty-symbol">∞</div><h2>O próximo som começa aqui.</h2>
      <p>Adicione seus arquivos em <code>src/assets/PAD</code>, separados por pasta,<br className="desktop-break" /> ou abra uma pasta do seu dispositivo para tocar agora.</p>
      <button className="primary" onClick={onUpload}>＋ Abrir pasta de pads</button>
      <span className="formats">MP3 · WAV · OGG · AAC · M4A · FLAC · OPUS · WEBM</span><small>Álbuns adicionados ficam salvos neste navegador.</small>
    </div> : <div className="folders-grid">{folders.map(name => <div className="folder-card" key={name} style={{ '--album-color': albumColor(name) } as CSSProperties}>
      <button className="folder-open" onClick={() => onOpen(name)}><div className="folder-art"><span>≋</span></div><div className="folder-info"><strong>{albumTitle(name)}</strong><span>{orderedTracks(tracks.filter(track => track.folder === name)).length} tons <b>→</b></span></div></button>
      <button className="folder-edit" aria-label={`Editar álbum ${albumTitle(name)}`} onClick={() => onEdit(name)}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m16 3 5 5-12 12-6 1 1-6Z" /><path d="m14 5 5 5" /></svg></button>
      {!protectedFolders.has(name) && <button className="folder-remove" aria-label={`Remover álbum ${albumTitle(name)}`} onClick={() => onDelete(name)}>×</button>}
    </div>)}</div>}
  </section>;
}
