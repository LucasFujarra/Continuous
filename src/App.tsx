import { useEffect, useRef, useState } from 'react';
import logo from '../assets/Continuous.png';
import icon from '../assets/Icon.png';
import { PadPlayer } from './audio/PadPlayer';
import { AUDIO_PATTERN, displayName, normalizeName, orderedTracks, type Mode, type Track } from './lib/library';
import { bundledTracks } from './lib/catalog';

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
  const input = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);
  const folders = [...new Set(tracks.map(track => track.folder))].sort((a, b) => a.localeCompare(b));
  const visible = orderedTracks(tracks.filter(track => track.folder === folder));

  useEffect(() => {
    player.current.setVolume(volume / 100);
    try { localStorage.setItem('continuous-volume', String(volume)); } catch { /* Storage is optional. */ }
  }, [volume]);
  useEffect(() => () => { player.current.destroy(); urls.current.forEach(url => URL.revokeObjectURL(url)); }, []);

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

  function importFiles(files: FileList | null) {
    if (!files) return;
    const imported = Array.from(files).filter(file => AUDIO_PATTERN.test(file.name)).map(file => {
      const url = URL.createObjectURL(file); urls.current.push(url);
      const parts = (file.webkitRelativePath || file.name).split('/');
      return { id: `local:${url}`, url, name: normalizeName(file.name), folder: parts.length > 1 ? parts.slice(0, -1).join(' / ') : 'Arquivos locais' };
    });
    if (!imported.length) { setError('Nenhum arquivo de áudio encontrado na pasta selecionada.'); return; }
    setTracks(previous => [...previous, ...imported]); setError(''); setFolder(null);
  }

  return <div className="app">
    <header className="header">
      <a className="brand" href="#" onClick={event => { event.preventDefault(); setFolder(null); }} aria-label="Continuous, início"><img src={icon} alt="" /><span>Continuous<small>AMBIENT PAD PLAYER</small></span></a>
      <img className="wordmark" src={logo} alt="Continuous" />
      <span className="header-tag"><span /> Seu som, contínuo.</span>
    </header>

    <main>
      <div className="intro"><div><p className="eyebrow">SEU ESPAÇO SONORO</p><h1>{folder || 'Escolha uma atmosfera.'}</h1><p className="subtitle">{folder ? 'Selecione um tom e deixe o som fluir.' : 'Pads contínuos para acompanhar cada momento.'}</p></div>
        <button className="secondary" onClick={() => input.current?.click()}>＋ Adicionar pasta</button>
        <input ref={input} type="file" multiple {...{ webkitdirectory: '' }} hidden onChange={event => { importFiles(event.target.files); event.target.value = ''; }} />
      </div>

      {error && <div className="error" role="alert">{error}<button aria-label="Fechar aviso" onClick={() => setError('')}>×</button></div>}

      <section className="library" aria-label="Biblioteca de pads">
        <div className="section-heading"><div>{folder && <button className="back" onClick={() => setFolder(null)}>← Voltar</button>}<span>{folder ? 'TONALIDADES' : 'BIBLIOTECA'}</span><span className="count">{folder ? visible.length : folders.length}</span></div>
          {folder ? <div className="segmented" aria-label="Modo tonal"><button aria-pressed={mode === 'major'} onClick={() => setMode('major')}>Maior</button><button aria-pressed={mode === 'minor'} onClick={() => setMode('minor')}>Menor</button></div> : <span className="muted">Seus pads, organizados por pasta</span>}
        </div>

        {!folder && !folders.length ? <div className="empty"><div className="empty-symbol">∞</div><h2>O próximo som começa aqui.</h2><p>Adicione seus arquivos em <code>assets/PAD</code>, separados por pasta,<br className="desktop-break" /> ou abra uma pasta do seu dispositivo para tocar agora.</p><button className="primary" onClick={() => input.current?.click()}>＋ Abrir pasta de pads</button><span className="formats">MP3 · WAV · OGG · AAC · M4A · FLAC · OPUS · WEBM</span><small>Arquivos locais ficam disponíveis apenas nesta sessão.</small></div> :
          <div className={folder ? 'notes-grid' : 'folders-grid'}>{folder ? visible.map((track, index) => <button key={track.id} className={`note-card ${active?.id === track.id ? 'playing' : ''}`} aria-pressed={active?.id === track.id} onClick={() => void play(track)}><span className="card-index">{String(index + 1).padStart(2, '0')}</span><strong>{displayName(track.name, mode).replace('#', '♯')}</strong><span className="note-caption">{loading === track.id ? 'Carregando…' : active?.id === track.id ? '● Tocando' : mode === 'major' ? 'MAIOR' : 'MENOR'}</span></button>) : folders.map((name, index) => <button className="folder-card" key={name} style={{ '--hue': `${160 + index * 35}` } as React.CSSProperties} onClick={() => setFolder(name)}><div className="folder-art"><span>≋</span><span className="folder-arrow">↗</span></div><div className="folder-info"><strong>{name}</strong><span>{orderedTracks(tracks.filter(track => track.folder === name)).length} tons <b>→</b></span></div></button>)}</div>}
      </section>
      <div className="library-footnote"><span>∞ Reprodução em loop</span><span>Áudio original · sem conversão</span></div>
    </main>

    <footer className="player"><div className={`now-icon ${active ? 'is-playing' : ''}`}>{active ? '♫' : '∞'}</div><div className="now-playing"><span>{loading ? 'PREPARANDO ÁUDIO' : active ? 'TOCANDO AGORA' : 'PRONTO PARA TOCAR'}</span><strong>{active ? `${active.folder} · ${displayName(active.name, mode).replace('#', '♯')}` : loading ? 'Carregando seu pad…' : 'Nenhum pad tocando'}</strong></div><div className="volume"><label htmlFor="volume">Volume</label><input id="volume" type="range" min="0" max="100" value={volume} onChange={event => setVolume(Number(event.target.value))} /><output htmlFor="volume">{volume}%</output></div><button className="stop" disabled={!active && !loading} onClick={stop}>■ <span>Parar</span></button></footer>
  </div>;
}
