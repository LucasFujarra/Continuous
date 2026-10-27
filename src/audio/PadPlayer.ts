import type { Track } from '../lib/library';

export class PadPlayer {
  private audio: HTMLAudioElement | null = null;
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private version = 0;
  private volume = 0.8;

  setVolume(value: number) {
    this.volume = value;
    if (this.gain && this.context) {
      this.gain.gain.cancelScheduledValues(this.context.currentTime);
      this.gain.gain.setTargetAtTime(value, this.context.currentTime, 0.02);
    } else if (this.audio) this.audio.volume = value;
  }

  async play(track: Track, onError: (message: string) => void) {
    this.disposeAudio();
    const version = ++this.version;
    const audio = new Audio(track.url);
    this.audio = audio;
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = this.volume;
    audio.onerror = () => {
      if (version === this.version) onError('Não foi possível abrir este áudio. Verifique o arquivo e o suporte ao formato neste navegador.');
    };
    try {
      this.context ??= new AudioContext();
      await this.context.resume();
      if (version !== this.version) return false;
      const source = this.context.createMediaElementSource(audio);
      this.gain = this.context.createGain();
      this.gain.gain.value = this.volume;
      source.connect(this.gain).connect(this.context.destination);
      audio.volume = 1;
      await audio.play();
      return version === this.version;
    } catch (error) {
      if (version !== this.version) return false;
      this.disposeAudio();
      throw error;
    }
  }

  stop() {
    ++this.version;
    if (!this.audio) return;
    if (this.gain && this.context && this.context.state === 'running') {
      const now = this.context.currentTime;
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setValueAtTime(this.gain.gain.value, now);
      this.gain.gain.linearRampToValueAtTime(0, now + 1.2);
      this.timer = setTimeout(() => this.disposeAudio(), 1200);
    } else this.disposeAudio();
  }

  private disposeAudio() {
    clearTimeout(this.timer);
    if (this.audio) {
      this.audio.onerror = null;
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
      this.audio = null;
    }
    this.gain?.disconnect();
    this.gain = null;
  }

  destroy() {
    ++this.version;
    this.disposeAudio();
    void this.context?.close();
    this.context = null;
  }
}
