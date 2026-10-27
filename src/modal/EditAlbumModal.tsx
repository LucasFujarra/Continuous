import { lazy, Suspense, useRef, useState, type PointerEvent } from 'react';
import { hexToHsv, hsvToHex, type AlbumSettings } from '../lib/albumSettings';
import { emojiCoverColor } from '../lib/albumCovers';
import { Modal } from './Modal';

const AlbumEmojiPicker = lazy(() => import('./AlbumEmojiPicker'));

interface EditAlbumModalProps {
  title: string;
  color: string;
  cover: string;
  system: boolean;
  onClose: () => void;
  onSave: (settings: AlbumSettings) => void;
}

export function EditAlbumModal({ title, color, cover, system, onClose, onSave }: EditAlbumModalProps) {
  const [name, setName] = useState(title);
  const [selectedCover, setSelectedCover] = useState(cover);
  const [coversOpen, setCoversOpen] = useState(false);
  const [hsv, setHsv] = useState(() => hexToHsv(color));
  const [hex, setHex] = useState(color);
  const [error, setError] = useState('');
  const [wheelOpen, setWheelOpen] = useState(false);
  const wheel = useRef<HTMLDivElement>(null);
  const validHex = /^#[0-9a-f]{6}$/i.test(hex);

  function updateColor(next: typeof hsv) {
    setHsv(next);
    setHex(hsvToHex(next.hue, next.saturation, next.value));
  }

  function selectColor(event: PointerEvent<HTMLDivElement>) {
    const rect = wheel.current!.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    updateColor({ ...hsv, hue: (Math.atan2(y, x) * 180 / Math.PI + 360) % 360, saturation: Math.min(1, Math.hypot(x, y) / (rect.width / 2)) });
  }

  const angle = hsv.hue * Math.PI / 180;
  return <Modal className="album-edit-modal" title="Editar álbum" onClose={onClose}>
    <form onSubmit={event => {
      event.preventDefault();
      if (!validHex || !name.trim()) return;
      try { onSave({ title: system ? undefined : name.trim(), color: hex.toLowerCase(), cover: selectedCover }); }
      catch { setError('Não foi possível salvar as alterações neste navegador.'); }
    }}>
      <div className="album-edit-heading">
        <button type="button" className="album-cover-preview" style={{ '--cover-color': validHex ? hex : color } as React.CSSProperties} aria-label="Escolher capa do álbum" aria-expanded={coversOpen} aria-controls="album-cover-options" onClick={() => setCoversOpen(previous => !previous)}>
          <span aria-hidden="true">{selectedCover}</span><span className="cover-edit-hint" aria-hidden="true">✎</span>
        </button>
        <div className="album-title-field"><label className="edit-label" htmlFor="album-title">Título</label>
          <input id="album-title" className="edit-input" value={name} readOnly={system} maxLength={120} onChange={event => setName(event.target.value)} />
        </div>
      </div>
      {coversOpen && <div id="album-cover-options">
        <Suspense fallback={<p role="status">Carregando emojis…</p>}>
          <AlbumEmojiPicker onSelect={emoji => {
            setSelectedCover(emoji);
            const suggestedColor = emojiCoverColor(emoji);
            if (suggestedColor) updateColor(hexToHsv(suggestedColor));
          }} />
        </Suspense>
      </div>}
      <label className="edit-label" htmlFor="album-hex">Hexadecimal</label>
      <div className="hex-field">
        <button type="button" className="color-swatch" style={{ background: validHex ? hex : 'transparent' }} aria-label="Abrir ou fechar círculo de cores" aria-expanded={wheelOpen} aria-controls="album-color-wheel" onClick={() => setWheelOpen(previous => !previous)} />
        <div className="hex-input-wrap">
          <input id="album-hex" className="edit-input" value={hex} maxLength={7} spellCheck={false} aria-invalid={!validHex} onChange={event => { const value = event.target.value; setHex(value); if (/^#[0-9a-f]{6}$/i.test(value)) setHsv(hexToHsv(value)); }} />
          <button type="button" className="color-random" aria-label="Sortear cor" title="Sortear cor" onClick={() => updateColor({ hue: Math.random() * 360, saturation: .4 + Math.random() * .4, value: .65 + Math.random() * .35 })}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 7v5h-5" /><path d="M20 12a8 8 0 1 0-2 5.3" /></svg>
          </button>
        </div>
      </div>
      {!validHex && <p className="modal-error">Use uma cor no formato #AABBCC.</p>}
      {wheelOpen && <div id="album-color-wheel" ref={wheel} className="color-wheel" aria-hidden="true" style={{ filter: `brightness(${hsv.value})` }} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); selectColor(event); }} onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) selectColor(event); }}>
        <span style={{ left: `${50 + Math.cos(angle) * hsv.saturation * 50}%`, top: `${50 + Math.sin(angle) * hsv.saturation * 50}%` }} />
      </div>}
      <label className="edit-label" htmlFor="album-hue">Cor</label>
      <input id="album-hue" className="color-range hue-range" type="range" min="0" max="359" value={hsv.hue} onChange={event => updateColor({ hue: Number(event.target.value), saturation: 1, value: hsv.value > 0 ? hsv.value : 1 })} />
      <label className="edit-label" htmlFor="album-brightness">Brilho</label>
      <input id="album-brightness" className="color-range" type="range" min="0" max="100" value={hsv.value * 100} style={{ background: `linear-gradient(to right, #000, ${hsvToHex(hsv.hue, hsv.saturation, 1)})` }} onChange={event => updateColor({ ...hsv, value: Number(event.target.value) / 100 })} />
      {error && <p className="modal-error" role="alert">{error}</p>}
      <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button type="submit" className="primary" disabled={!validHex || !name.trim()}>Salvar</button></div>
    </form>
  </Modal>;
}
