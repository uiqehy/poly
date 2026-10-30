/**
 * Web Audio API based procedural sound synthesizer
 * Supports dynamic volume & pitch based on real-time fluid flow rate
 */

class SoundController {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private pourGain: GainNode | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopPourSound();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playClick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {}
  }

  public startPourSound(type: 'water' | 'sand' = 'water') {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.noiseNode) return; // already running

      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * (type === 'sand' ? 0.07 : 0.05);
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'bandpass';
      this.filterNode.frequency.setValueAtTime(type === 'sand' ? 950 : 650, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(1.8, this.ctx.currentTime);

      this.pourGain = this.ctx.createGain();
      this.pourGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.pourGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.2);

      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(this.pourGain);
      this.pourGain.connect(this.ctx.destination);

      this.noiseNode.start();
    } catch {}
  }

  public updateFlowRate(flowRate: number) {
    if (this.isMuted || !this.pourGain || !this.ctx || !this.filterNode) return;
    try {
      const clamped = Math.max(0, Math.min(1, flowRate));
      const targetGain = clamped * 0.18;
      this.pourGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);

      // Pitch increases slightly with heavy flow
      const baseFreq = 650;
      this.filterNode.frequency.setTargetAtTime(baseFreq + clamped * 350, this.ctx.currentTime, 0.05);
    } catch {}
  }

  public stopPourSound() {
    if (this.pourGain && this.ctx) {
      try {
        this.pourGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        setTimeout(() => {
          if (this.noiseNode) {
            try { this.noiseNode.stop(); } catch {}
            this.noiseNode.disconnect();
            this.noiseNode = null;
          }
          this.filterNode = null;
          this.pourGain = null;
        }, 160);
      } catch {
        this.noiseNode = null;
      }
    }
  }

  public playChime(isFinal: boolean = false) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = isFinal ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.001, this.ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + idx * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.85);
      });
    } catch {}
  }
}

export const sound = new SoundController();
