import { useEffect, useRef, useState, type CSSProperties } from 'react';
import './BlurWaves.css';

interface BlurWavesProps {
  activeTrackId: string | null;
  activeFolder: string | null;
  folders: string[];
  volume: number;
}

const FADE_DURATION = 700;

export function BlurWaves({ activeTrackId, activeFolder, folders, volume }: BlurWavesProps) {
  const nextHue = 160 + Math.max(0, folders.indexOf(activeFolder ?? '')) * 35;
  const [hue, setHue] = useState(nextHue);
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
      setHue(nextHue);
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
  }, [activeTrackId, activeFolder, nextHue]);

  const size = Math.min(100, Math.max(0, volume)) / 100;
  const style = {
    '--playing-hue': hue,
    '--wave-size': size,
    '--wave-visible': visible && size > 0 ? 1 : 0,
  } as CSSProperties;

  return <div className="ambient-waves" style={style} aria-hidden="true">
    <div className="ambient-wave ambient-wave-left" />
    <div className="ambient-wave ambient-wave-right" />
  </div>;
}
