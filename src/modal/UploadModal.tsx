import { useRef, useState } from 'react';
import { AUDIO_PATTERN } from '../lib/library';
import { Modal } from './Modal';

export interface SelectedAudio {
  file: File;
  folder: string;
}

interface Directory {
  kind: 'directory';
  name: string;
  values: () => AsyncIterable<Directory | { kind: 'file'; name: string; getFile: () => Promise<File> }>;
}

type PickerWindow = Window & { showDirectoryPicker?: (options: { mode: 'read' }) => Promise<Directory> };

interface UploadModalProps {
  onClose: () => void;
  onImport: (files: SelectedAudio[]) => Promise<boolean>;
}

async function readDirectory(directory: Directory, path = directory.name): Promise<SelectedAudio[]> {
  const files: SelectedAudio[] = [];
  for await (const entry of directory.values()) {
    if (entry.kind === 'directory') files.push(...await readDirectory(entry, `${path} / ${entry.name}`));
    else if (AUDIO_PATTERN.test(entry.name)) files.push({ file: await entry.getFile(), folder: path });
  }
  return files;
}

export function UploadModal({ onClose, onImport }: UploadModalProps) {
  const input = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<SelectedAudio[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const supportsFolders = typeof (window as PickerWindow).showDirectoryPicker === 'function';
  const folders = [...new Set(selected.map(item => item.folder))];

  function addSelection(files: SelectedAudio[]) {
    if (!files.length) { setError('Nenhum arquivo de áudio encontrado. Selecione outra pasta ou arquivos.'); return; }
    setSelected(previous => {
      const unique = new Map(previous.map(item => [`${item.folder}/${item.file.name}`, item]));
      files.forEach(item => unique.set(`${item.folder}/${item.file.name}`, item));
      return [...unique.values()];
    });
    setError('');
  }

  async function selectFolder() {
    const picker = (window as PickerWindow).showDirectoryPicker;
    if (!picker) { input.current?.click(); return; }
    setError('');
    setBusy(true);
    try {
      const directory = await picker.call(window, { mode: 'read' });
      addSelection(await readDirectory(directory));

    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError('Não foi possível acessar a pasta. Tente selecioná-la novamente.');
    } finally { setBusy(false); }
  }

  async function confirmImport() {
    setBusy(true);
    setError('');
    try {
      if (await onImport(selected)) onClose();
    } catch {
      setError('Não foi possível salvar os áudios. Verifique o espaço disponível e se o navegador permite armazenamento local.');
    } finally { setBusy(false); }
  }

  return <Modal title="Adicionar Pad" onClose={() => { if (!busy) onClose(); }}>
    <p>Adicione sua pasta com a coleção de pads nos formatos exibidos abaixo.</p>
    <div className="modal-upload">
      <span className="modal-symbol" aria-hidden="true">＋</span>
      <button className="primary" disabled={busy} onClick={() => void selectFolder()}>{busy ? 'Lendo pasta…' : supportsFolders ? 'Selecionar pasta' : 'Selecionar arquivos'}</button>
      <span>MP3 · WAV · OGG · AAC · M4A · MP4 · FLAC · OPUS · WEBM</span>
    </div>
    <input ref={input} type="file" multiple accept=".mp3,.wav,.ogg,.aac,.m4a,.mp4,.flac,.opus,.webm" hidden onChange={event => {
      if (event.target.files?.length) addSelection(Array.from(event.target.files).filter(file => AUDIO_PATTERN.test(file.name)).map(file => ({ file, folder: 'Arquivos locais' })));
      event.target.value = '';
    }} />
    {folders.length > 0 && <div className="modal-selection" aria-live="polite">
      <h3>Pastas selecionadas</h3>
      <ul>{folders.map(folder => <li key={folder}><div><strong>{folder}</strong><span>{selected.filter(item => item.folder === folder).length} áudios</span></div><button className="secondary" aria-label={`Remover seleção ${folder}`} onClick={() => setSelected(previous => previous.filter(item => item.folder !== folder))}>×</button></li>)}</ul>
    </div>}
    {error && <p className="modal-error" role="alert">{error}</p>}
    <div className="modal-actions">
      <button className="secondary" disabled={busy} onClick={onClose}>Cancelar</button>
      <button className="primary" disabled={busy || !selected.length} onClick={() => void confirmImport()}>Confirmar</button>
    </div>
  </Modal>;
}
