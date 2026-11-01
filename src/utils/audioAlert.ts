import { BOUNCE_AUDIO_BASE64 } from './bounceAudioData';

/**
 * Audio effects for budget alerts, interactive pull-chain switch, and spring cord recoil.
 * Supports the user's bouncing-sound MP3 asset with embedded fallback and Web Audio API synthesis.
 */
class BudgetAudioAlert {
  private audioCtx: AudioContext | null = null;
  private bounceAudioPool: HTMLAudioElement[] = [];
  private poolIndex = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        // Pre-create a pool of audio instances so rapid pulling/bouncing never clips
        for (let i = 0; i < 3; i++) {
          // Try asset path first with fallback to base64
          const audio = new Audio('/assets/aistudio/bouncing-sound-single_eac73181.mp3');
          audio.preload = 'auto';
          audio.addEventListener('error', () => {
            // If relative asset path cannot be found (e.g. downloaded offline file), switch to base64
            audio.src = BOUNCE_AUDIO_BASE64;
          }, { once: true });
          this.bounceAudioPool.push(audio);
        }
      } catch {
        // Fallback handled in playBounceSound
      }
    }
  }

  public unlock() {
    this.initContext();
    if (this.bounceAudioPool.length > 0) {
      try {
        // Prime audio element for mobile/Safari
        this.bounceAudioPool[0].load();
      } catch {
        // Ignore
      }
    }
  }

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Play the user-provided bounce sound on pull cord release / spring recoil
   */
  public playBounceSound() {
    try {
      if (this.bounceAudioPool.length > 0) {
        const audio = this.bounceAudioPool[this.poolIndex % this.bounceAudioPool.length];
        this.poolIndex++;
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay policy or asset restriction fallback
            this.playSynthesizedBounce();
          });
        }
        return;
      }
    } catch {
      // Audio element fallback
    }
    this.playSynthesizedBounce();
  }

  /**
   * High-fidelity Web Audio API synthesized spring bounce sound fallback
   */
  public playSynthesizedBounce() {
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Realistic rubbery spring oscillation
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.16);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.32);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Ignore
    }
  }

  /**
   * Sound for turning lamp ON: crisp mechanical click + bright upward incandescent warm chime
   */
  public playLampOn() {
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // 1. Mechanical switch click
      const clickOsc = this.audioCtx.createOscillator();
      const clickGain = this.audioCtx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(1800, now);
      clickOsc.frequency.exponentialRampToValueAtTime(450, now + 0.025);

      clickGain.gain.setValueAtTime(0.45, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      clickOsc.connect(clickGain);
      clickGain.connect(this.audioCtx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.035);

      // 2. Bright incandescent warm chime (rising bell)
      const toneOsc = this.audioCtx.createOscillator();
      const toneGain = this.audioCtx.createGain();
      toneOsc.type = 'sine';
      toneOsc.frequency.setValueAtTime(523.25, now + 0.02); // C5
      toneOsc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12); // C6

      toneGain.gain.setValueAtTime(0.3, now + 0.02);
      toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      toneOsc.connect(toneGain);
      toneGain.connect(this.audioCtx.destination);
      toneOsc.start(now + 0.02);
      toneOsc.stop(now + 0.4);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Sound for turning lamp OFF: heavy, solid mechanical pull-chain switch clack
   */
  public playLampOff() {
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Pulse 1: High metallic snap
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1400, now);
      osc1.frequency.exponentialRampToValueAtTime(280, now + 0.035);

      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.04);

      // Pulse 2: Heavy mechanical switch clack
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(420, now + 0.03);
      osc2.frequency.exponentialRampToValueAtTime(110, now + 0.1);

      gain2.gain.setValueAtTime(0.35, now + 0.03);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.03);
      osc2.stop(now + 0.12);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Pull-chain switch click sound fallback
   */
  public playPullCordClick() {
    this.playLampOn();
  }

  /**
   * Urgent warning double-tone (Over 100% threshold)
   */
  public playOverspendAlert() {
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.setValueAtTime(587.33, now + 0.12); // D5

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(392, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Subtle pleasant confirmation chime for transaction logged
   */
  public playConfirmChime() {
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.1); // G5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Ignore
    }
  }
}

export const audioAlert = new BudgetAudioAlert();
