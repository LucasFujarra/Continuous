import logo from '../assets/Continuous.png';

interface ScreenHeaderProps {
  title: string;
  restoring: boolean;
  homeHref: string;
  onHome: () => void;
  onUpload: () => void;
}

export function ScreenHeader({ title, restoring, homeHref, onHome, onUpload }: ScreenHeaderProps) {
  return <div className="intro album-intro">
    <div><p className="eyebrow">Continuous</p><h1>{title}</h1></div>
    <a className="album-logo" href={homeHref} aria-label="Continuous, voltar para a home" onClick={event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); onHome();
    }}><img className="wordmark" src={logo} alt="Continuous" /></a>
    <button className="secondary" disabled={restoring} onClick={onUpload}>＋ Adicionar Pad</button>
  </div>;
}
