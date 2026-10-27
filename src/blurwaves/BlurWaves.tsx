import { useEffect, useRef, useState, type CSSProperties } from 'react';
import './BlurWaves.css';

interface BlurWavesProps {
  activeTrackId: string | null;
  activeFolder: string | null;
  color: string;
  volume: number;
}

const FADE_DURATION = 700;

export function BlurWaves({ activeTrackId, activeFolder, color, volume }: BlurWavesProps) {
  const nextColor = color;
  const [waveColor, setWaveColor] = useState(nextColor);
  const [visible, setVisible] = useState(false);
  const displayed = useRef(false);

  useEffect(() => {
    setVisible(false);
    let fadeIn: ReturnType<typeof setTimeout> | undefined;
    const transition = setTimeout(() => {
      if (activeTrackId === null || activeFolder === null) {
        displayed.current = false;
        return;
      }
      setWaveColor(nextColor);
      // Apply the new color while hidden before starting the fade-in.
      fadeIn = setTimeout(() => {
        displayed.current = true;
        setVisible(true);
      }, 32);
    }, displayed.current ? FADE_DURATION : 0);

    return () => {
      clearTimeout(transition);
      clearTimeout(fadeIn);
    };
  }, [activeTrackId, activeFolder, nextColor]);

  const size = Math.min(100, Math.max(0, volume)) / 100;
  const style = {
    '--wave-color': waveColor,
    '--wave-size': size,
    '--wave-visible': visible && size > 0 ? 1 : 0,
  } as CSSProperties;

  return <div className="ambient-waves" style={style} aria-hidden="true">
    <div className="ambient-wave ambient-wave-left" />
    <div className="ambient-wave ambient-wave-right" />
  </div>;
}
