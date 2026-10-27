import { useEffect, useRef, useState } from 'react';
import { Home } from './screens/Home';
import { Pad } from './screens/Pad';
import { ScreenHeader } from './screens/ScreenHeader';
import { padPath, resolvePadRoute } from './lib/routes';
import { EditAlbumModal } from './modal/EditAlbumModal';
import { colorLuminance, contrastingText, defaultAlbumColor, loadAlbumPreferences, type AlbumSettings } from './lib/albumSettings';
import { BlurWaves } from './blurwaves/BlurWaves';
import { PadPlayer } from './audio/PadPlayer';
import { AUDIO_PATTERN, displayName, normalizeName, orderedTracks, type Mode, type Track } from './lib/library';
import { bundledTracks } from './lib/catalog';
import { audioKey, cacheAudio, deleteCachedAlbum, loadCachedAudio } from './lib/audioCache';
import { DeleteAlbumModal } from './modal/DeleteAlbumModal';
import { UploadModal, type SelectedAudio } from './modal/UploadModal';

export default function App() {
  const [albumPreferences, setAlbumPreferences] = useState(loadAlbumPreferences);
  const [albumToEdit, setAlbumToEdit] = useState<string | null>(null);
  const [tracks, setTracks] = useState(bundledTracks);
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const readPath = () => {
    const path = window.location.pathname;
    return basePath && path.startsWith(`${basePath}/`) ? path.slice(basePath.length) : path === basePath ? '/' : path;
  };
  const [path, setPath] = useState(readPath);

  function navigate(next: string, replace = false) {
    const url = `${basePath}${next}`;
    if (window.location.pathname !== url) window.history[replace ? 'replaceState' : 'pushState'](null, '', url);
    setPath(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  useEffect(() => {
    const onPopState = () => setPath(readPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
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
  const route = resolvePadRoute(path, folders, tracks);
  const folder = route?.folder ?? null;
  const themeFolder = active?.folder ?? folder;
  const albumTitle = (name: string) => protectedFolders.has(name) ? name : albumPreferences[name]?.title ?? name;
  const albumCover = (name: string) => albumPreferences[name]?.cover ?? '≋';
  const albumColor = (name: string) => albumPreferences[name]?.color ?? defaultAlbumColor(folders.indexOf(name));
  const themeColor = themeFolder ? albumColor(themeFolder) : '#8b81e4';

  function saveAlbumSettings(settings: AlbumSettings) {
    if (albumToEdit === null) return;
    const next = { ...albumPreferences, [albumToEdit]: settings };
    localStorage.setItem('continuous-albums', JSON.stringify(next));
    setAlbumPreferences(next);
    setAlbumToEdit(null);
  }
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
    setError(''); navigate('/');
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
      if (folder === album) navigate('/');
      setAlbumToDelete(null);
    } catch {
      setAlbumToDelete(null);
      setError('Não foi possível excluir o álbum salvo. Tente novamente.');
    } finally { setDeleting(false); }
  }

  useEffect(() => {
    // Imported albums must finish restoring before validating a direct link.
    if (restoring) return;
    if (path !== '/' && !route) navigate('/', true);
    else if (route?.track) setMode(route.mode);
  }, [path, restoring, tracks]);

  function selectMode(next: Mode) {
    setMode(next);
    if (folder && route?.track) navigate(padPath(folder, folders, route.track, next));
  }

  function selectTrack(track: Track) {
    navigate(padPath(track.folder, folders, track, mode));
    void play(track);
  }

  useEffect(() => {
    document.title = active ? `Continuous - ${albumTitle(active.folder)}` : 'Continuous';
  }, [active, albumPreferences]);

  return <div className={folder ? 'app album-view blurwaves-host' : 'app blurwaves-host'} style={{ '--accent': themeColor, '--accent-text': contrastingText(themeColor), '--accent-readable': colorLuminance(themeColor) < 0.15 ? `color-mix(in srgb, ${themeColor} 45%, white)` : themeColor } as React.CSSProperties}>
    <BlurWaves activeTrackId={active?.id ?? null} activeFolder={active?.folder ?? null} color={active ? albumColor(active.folder) : themeColor} volume={volume} />
    <main>
      <ScreenHeader title={folder ? albumTitle(folder) : 'Escolha uma atmosfera.'} restoring={restoring} homeHref={`${basePath}/`} onHome={() => navigate('/')} onUpload={() => setUploadOpen(true)} />

      {error && <div className="error" role="alert">{error}<button aria-label="Fechar aviso" onClick={() => setError('')}>×</button></div>}

      {folder ? <Pad tracks={visible} mode={mode} activeId={active?.id ?? null} loadingId={loading} selectedId={route?.track?.id ?? null} onHome={() => navigate('/')} onMode={selectMode} onPlay={selectTrack} />
        : <Home folders={folders} tracks={tracks} restoring={restoring} protectedFolders={protectedFolders} albumTitle={albumTitle} albumColor={albumColor} albumCover={albumCover} onOpen={name => navigate(padPath(name, folders))} onEdit={setAlbumToEdit} onDelete={setAlbumToDelete} onUpload={() => setUploadOpen(true)} />}
    </main>

    {albumToDelete !== null && <DeleteAlbumModal busy={deleting} album={albumTitle(albumToDelete)} onClose={() => { if (!deleting) setAlbumToDelete(null); }} onConfirm={() => void deleteAlbum()} />}
    {albumToEdit !== null && <EditAlbumModal onRestore={() => saveAlbumSettings({ ...albumPreferences[albumToEdit], color: defaultAlbumColor(folders.indexOf(albumToEdit)), cover: '≋' })} cover={albumCover(albumToEdit)} title={albumTitle(albumToEdit)} color={albumColor(albumToEdit)} system={protectedFolders.has(albumToEdit)} onClose={() => setAlbumToEdit(null)} onSave={saveAlbumSettings} />}
    {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} onImport={importFiles} />}

    <footer className="player"><div className={`now-icon ${active ? 'is-playing' : ''}`}>{active ? albumCover(active.folder) : '∞'}</div><div className="now-playing"><span>{loading ? 'PREPARANDO ÁUDIO' : active ? albumTitle(active.folder) : 'Continuous'}</span><strong>{active ? displayName(active.name, mode).replace('#', '♯') : loading ? 'Carregando seu pad…' : 'Nenhum pad tocando'}</strong></div><div className="volume"><label htmlFor="volume">Volume</label><input id="volume" type="range" min="0" max="100" value={volume} onChange={event => setVolume(Number(event.target.value))} /><output htmlFor="volume">{volume}%</output></div><button className="stop" disabled={!active && !loading} onClick={stop}>■ <span>Parar</span></button></footer>
  </div>;
}

//Lucas Fujarra 2026