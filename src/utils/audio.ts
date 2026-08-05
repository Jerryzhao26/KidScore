/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioSynth {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  toggleSound(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  isSoundEnabled() {
    return this.soundEnabled;
  }

  private init() {
    if (!this.soundEnabled) return;
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  /**
   * Super Mario-style high pitched dual coin chime
   */
  playCoin() {
    this.init();
    if (!this.ctx || !this.soundEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      // Fast pitch jump: B4 (493.88 Hz) then E5 (659.25 Hz)
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.setValueAtTime(0.12, now + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (err) {
      console.warn('Audio playCoin failed:', err);
    }
  }

  /**
   * Series of quick coins for bigger rewards
   */
  playCoinCascade(count: number = 3) {
    this.init();
    if (!this.ctx || !this.soundEnabled) return;

    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < Math.min(count, 8); i++) {
        const timeOffset = i * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        // Escalating frequency chain
        const freqBase = 523.25 + (i * 60); // rising frequency C5, D5, E5...
        osc.frequency.setValueAtTime(freqBase, now + timeOffset);
        osc.frequency.setValueAtTime(freqBase * 1.25, now + timeOffset + 0.06);

        gain.gain.setValueAtTime(0.10, now + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.2);

        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.25);
      }
    } catch (err) {
      console.warn('Audio playCoinCascade failed:', err);
    }
  }

  /**
   * Triumph arpeggio for goal completions
   */
  playTriumph() {
    this.init();
    if (!this.ctx || !this.soundEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
      
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const noteStart = now + idx * 0.08;

        osc.frequency.setValueAtTime(freq, noteStart);
        gain.gain.setValueAtTime(0.0, now);
        gain.gain.setValueAtTime(0.12, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.3);

        osc.start(noteStart);
        osc.stop(noteStart + 0.35);
      });
    } catch (err) {
      console.warn('Audio playTriumph failed:', err);
    }
  }

  /**
   * Spending gold coin sound - cash register clang + sliding slide
   */
  playSpend() {
    this.init();
    if (!this.ctx || !this.soundEnabled) return;

    try {
      const now = this.ctx.currentTime;
      
      // Part 1: High metallic ping (cash register ring)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.frequency.setValueAtTime(1800, now);
      osc1.type = 'sine';
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      osc1.start(now);
      osc1.stop(now + 0.4);

      // Part 2: Downward frequency sweep (coins leaving)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.frequency.setValueAtTime(587.33, now); // D5
      osc2.frequency.exponentialRampToValueAtTime(146.83, now + 0.4); // Sweep down to D3
      osc2.type = 'triangle';
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);

      gain2.gain.setValueAtTime(0.12, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc2.start(now);
      osc2.stop(now + 0.45);
    } catch (err) {
      console.warn('Audio playSpend failed:', err);
    }
  }

  /**
   * Sound indicating parents dashboard unlocked successfully
   */
  playUnlock() {
    this.init();
    if (!this.ctx || !this.soundEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
      osc.frequency.setValueAtTime(659.25, now + 0.2); // E5

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (err) {
      console.warn('Audio playUnlock failed:', err);
    }
  }

  /**
   * Two low buzzer tones indicating failed transactions / insufficient funds
   */
  playError() {
    this.init();
    if (!this.ctx || !this.soundEnabled) return;

    try {
      const now = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.frequency.setValueAtTime(120, now);
      osc.frequency.setValueAtTime(100, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.setValueAtTime(0.15, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (err) {
      console.warn('Audio playError failed:', err);
    }
  }
}

export const audio = new AudioSynth();
