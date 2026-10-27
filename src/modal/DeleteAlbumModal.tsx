import { Modal } from './Modal';

interface DeleteAlbumModalProps {
  album: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteAlbumModal({ album, busy, onClose, onConfirm }: DeleteAlbumModalProps) {
  return <Modal title="Deseja excluir o álbum?" onClose={onClose}>
    <p className="modal-album">{album}</p>
    <p>A pasta e os áudios salvos serão removidos deste navegador. Os arquivos do dispositivo serão preservados.</p>
    <div className="modal-actions">
      <button className="secondary" disabled={busy} autoFocus onClick={onClose}>Não</button>
      <button className="modal-danger" disabled={busy} onClick={onConfirm}>Sim, excluir</button>
    </div>
  </Modal>;
}
