import { useEffect, useRef, useState } from 'react';
import logo from './assets/Continuous.png';
import { BlurWaves } from './blurwaves/BlurWaves';
import { PadPlayer } from './audio/PadPlayer';
import { AUDIO_PATTERN, displayName, normalizeName, orderedTracks, type Mode, type Track } from './lib/library';
import { bundledTracks } from './lib/catalog';
import { audioKey, cacheAudio, deleteCachedAlbum, loadCachedAudio } from './lib/audioCache';
import { DeleteAlbumModal } from './modal/DeleteAlbumModal';
import { UploadModal, type SelectedAudio } from './modal/UploadModal';

export default function App() {
  const [tracks, setTracks] = useState(bundledTracks);
  const [folder, setFolder] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('major');
  const [active, setActive] = useState<Track | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [volume, setVolume] = useState(() => {
    try { const saved = localStorage.getItem('continuous-volume'); return saved === null ? 80 : Math.min(100, Math.max(0, Number(saved) || 0)); } catch { return 80; }
  });
  const player = useRef(new PadPlayer());
  const request = useRef(0);
  const [albumToDelete, setAlbumToDelete] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const urls = useRef<string[]>([]);
  const protectedFolders = new Set(bundledTracks.map(track => track.folder));
  const folders = [...new Set(tracks.map(track => track.folder))].sort((a, b) => a.localeCompare(b));
  const visible = orderedTracks(tracks.filter(track => track.folder === folder));

  useEffect(() => {
    player.current.setVolume(volume / 100);
    try { localStorage.setItem('continuous-volume', String(volume)); } catch { /* Storage is optional. */ }
  }, [volume]);
  useEffect(() => () => { player.current.destroy(); urls.current.forEach(url => URL.revokeObjectURL(url)); }, []);

  function addLocalTracks(files: SelectedAudio[]) {
    const imported = files.map(audio => {
      const url = URL.createObjectURL(audio.file);
      urls.current.push(url);
      return { id: `local:${audioKey(audio)}`, url, name: normalizeName(audio.file.name), folder: audio.folder };
    });
    setTracks(previous => [...previous.filter(track => !imported.some(item => item.id === track.id)), ...imported]);
  }

  useEffect(() => {
    let mounted = true;
    loadCachedAudio().then(files => {
      if (mounted) addLocalTracks(files);
    }).catch(() => {
      if (mounted) setError('Não foi possível restaurar os álbuns salvos neste navegador.');
    }).finally(() => { if (mounted) setRestoring(false); });
    return () => { mounted = false; };
  }, []);

  function stop() {
    request.current++;
    player.current.stop();
    setActive(null);
    setLoading(null);
  }

  async function play(track: Track) {
    if (active?.id === track.id || loading === track.id) { stop(); return; }
    const current = ++request.current;
    setError(''); setActive(null); setLoading(track.id);
    try {
      const started = await player.current.play(track, message => {
        if (current !== request.current) return;
        stop(); setError(message);
      });
      if (current !== request.current) return;
      if (started) setActive(track);
      setLoading(null);
    } catch {
      if (current !== request.current) return;
      setLoading(null);
      setError('Não foi possível reproduzir o áudio. O formato pode não ser suportado pelo navegador ou pelo sistema.');
    }
  }

  async function importFiles(files: SelectedAudio[]) {
    const valid = files.filter(({ file }) => AUDIO_PATTERN.test(file.name));
    if (!valid.length) return false;
    await cacheAudio(valid);
    addLocalTracks(valid);
    setError(''); setFolder(null);
    return true;
  }

  async function deleteAlbum() {
    if (albumToDelete === null || protectedFolders.has(albumToDelete) || deleting) return;
    const album = albumToDelete;
    setDeleting(true);
    try {
      await deleteCachedAlbum(album);
      if (active?.folder === album || tracks.some(track => track.id === loading && track.folder === album)) stop();
      setTracks(previous => previous.filter(track => track.folder !== album));
      if (folder === album) setFolder(null);
      setAlbumToDelete(null);
    } catch {
      setAlbumToDelete(null);
      setError('Não foi possível excluir o álbum salvo. Tente novamente.');
    } finally { setDeleting(false); }
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [folder]);

  return <div className={folder ? 'app album-view blurwaves-host' : 'app blurwaves-host'}>
    <BlurWaves activeTrackId={active?.id ?? null} activeFolder={active?.folder ?? null} folders={folders} volume={volume} />
    {!folder && <header className="header">
      <a className="brand" href="#" onClick={event => { event.preventDefault(); setFolder(null); }} aria-label="Continuous, início"><span>Continuous<small>AMBIENT PAD PLAYER</small></span></a>
      <img className="wordmark" src={logo} alt="Continuous" />
    </header>}

    <main>
      <div className={folder ? 'intro album-intro' : 'intro'}><div><p className="eyebrow">SEU ESPAÇO SONORO</p><h1>{folder || 'Escolha uma atmosfera.'}</h1></div>
        {folder && <img className="wordmark album-logo" src={logo} alt="Continuous" />}
        <button className="secondary" disabled={restoring} onClick={() => setUploadOpen(true)}>＋ Adicionar pasta</button>
      </div>

      {error && <div className="error" role="alert">{error}<button aria-label="Fechar aviso" onClick={() => setError('')}>×</button></div>}

      <section className="library" aria-label="Biblioteca de pads">
        <div className="section-heading"><div>{folder && <button className="back" onClick={() => setFolder(null)}>← Voltar</button>}<span>{folder ? 'TONALIDADES' : 'BIBLIOTECA'}</span><span className="count">{folder ? visible.length : folders.length}</span></div>
          {folder && <div className="segmented" aria-label="Modo tonal"><button aria-pressed={mode === 'major'} onClick={() => setMode('major')}>Maior</button><button aria-pressed={mode === 'minor'} onClick={() => setMode('minor')}>Menor</button></div>}
        </div>

        {!folder && !folders.length ? <div className="empty"><div className="empty-symbol">∞</div><h2>O próximo som começa aqui.</h2><p>Adicione seus arquivos em <code>src/assets/PAD</code>, separados por pasta,<br className="desktop-break" /> ou abra uma pasta do seu dispositivo para tocar agora.</p><button className="primary" disabled={restoring} onClick={() => setUploadOpen(true)}>＋ Abrir pasta de pads</button><span className="formats">MP3 · WAV · OGG · AAC · M4A · FLAC · OPUS · WEBM</span><small>Álbuns adicionados ficam salvos neste navegador.</small></div> :
          <div className={folder ? 'notes-grid' : 'folders-grid'}>{folder ? visible.map((track, index) => <button key={track.id} className={`note-card ${active?.id === track.id ? 'playing' : ''}`} aria-pressed={active?.id === track.id} onClick={() => void play(track)}><span className="card-index">{String(index + 1).padStart(2, '0')}</span><strong>{displayName(track.name, mode).replace('#', '♯')}</strong><span className="note-caption">{loading === track.id ? 'Carregando…' : active?.id === track.id ? '● Tocando' : mode === 'major' ? 'MAIOR' : 'MENOR'}</span></button>) : folders.map((name, index) => <div className="folder-card" key={name} style={{ '--hue': `${160 + index * 35}` } as React.CSSProperties}><button className="folder-open" onClick={() => setFolder(name)}><div className="folder-art"><span>≋</span></div><div className="folder-info"><strong>{name}</strong><span>{orderedTracks(tracks.filter(track => track.folder === name)).length} tons <b>→</b></span></div></button>{!protectedFolders.has(name) && <button className="folder-remove" aria-label={`Remover álbum ${name}`} onClick={() => setAlbumToDelete(name)}>×</button>}</div>)}</div>}
      </section>
    </main>

    {albumToDelete !== null && <DeleteAlbumModal busy={deleting} album={albumToDelete} onClose={() => { if (!deleting) setAlbumToDelete(null); }} onConfirm={() => void deleteAlbum()} />}
    {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} onImport={importFiles} />}

    <footer className="player"><div className={`now-icon ${active ? 'is-playing' : ''}`}>{active ? '♫' : '∞'}</div><div className="now-playing"><span>{loading ? 'PREPARANDO ÁUDIO' : active ? 'TOCANDO AGORA' : 'PRONTO PARA TOCAR'}</span><strong>{active ? `${active.folder} · ${displayName(active.name, mode).replace('#', '♯')}` : loading ? 'Carregando seu pad…' : 'Nenhum pad tocando'}</strong></div><div className="volume"><label htmlFor="volume">Volume</label><input id="volume" type="range" min="0" max="100" value={volume} onChange={event => setVolume(Number(event.target.value))} /><output htmlFor="volume">{volume}%</output></div><button className="stop" disabled={!active && !loading} onClick={stop}>■ <span>Parar</span></button></footer>
  </div>;
}
