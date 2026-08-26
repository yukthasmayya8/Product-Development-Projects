/**
 * Simple Web Audio API utility for non-intrusive sound effects.
 */

class SoundEffects {
  private audioCtx: AudioContext | null = null;

  private init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
  }

  private playTone(
    freq: number,
    type: OscillatorType = "sine",
    duration: number = 0.1,
    volume: number = 0.1,
  ) {
    this.init();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

    gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      this.audioCtx.currentTime + duration,
    );

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  public click() {
    this.playTone(800, "sine", 0.05, 0.05);
  }

  public correct() {
    this.playTone(1200, "sine", 0.1, 0.08);
    setTimeout(() => this.playTone(1600, "sine", 0.1, 0.08), 50);
  }

  public error() {
    this.playTone(200, "sawtooth", 0.2, 0.05);
  }

  public complete() {
    const tones = [1200, 1400, 1600, 1800, 2000];
    tones.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, "sine", 0.2, 0.1), i * 100);
    });
  }
}

export const sounds = new SoundEffects();
