/**
 * The noise a chase makes.
 *
 * Synthesised rather than shipped as a file: it is a riser and a hit, which
 * the Web Audio API makes out of two oscillators and a bit of noise, and that
 * beats adding a binary asset — and a download — to every page load for
 * something one pull in a hundred ever hears.
 *
 * Browsers refuse to start audio without a gesture, so this must be called
 * from the tap that opens the box. If it is blocked anyway, or the API is
 * missing, the whole thing fails quietly: no chase should ever break because
 * a speaker would not co-operate.
 */

/** Kept modest on purpose — nobody asked for this to be loud. */
const PEAK = 0.16;

export interface ChaseSound {
  /** The moment the box gives: a hit under the riser's peak. */
  pop: () => void;
  /** Stops everything and releases the context. */
  stop: () => void;
}

const NO_SOUND: ChaseSound = { pop: () => {}, stop: () => {} };

export function playChaseWindup(windMs: number): ChaseSound {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return NO_SOUND;

    const ctx = new Ctor();
    const now = ctx.currentTime;
    const wind = windMs / 1000;
    const master = ctx.createGain();
    master.gain.value = PEAK;
    master.connect(ctx.destination);

    // The riser: a slow climb that gets louder as it gets higher, which is
    // what makes a wait feel like it is heading somewhere.
    const riser = ctx.createOscillator();
    riser.type = "sawtooth";
    riser.frequency.setValueAtTime(110, now);
    riser.frequency.exponentialRampToValueAtTime(1400, now + wind);

    // Swept low-pass, so the climb opens up rather than just getting shriller.
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(6000, now + wind);
    filter.Q.value = 6;

    const riserGain = ctx.createGain();
    riserGain.gain.setValueAtTime(0.0001, now);
    riserGain.gain.exponentialRampToValueAtTime(0.9, now + wind * 0.92);
    riserGain.gain.exponentialRampToValueAtTime(0.0001, now + wind + 0.12);

    riser.connect(filter).connect(riserGain).connect(master);
    riser.start(now);
    riser.stop(now + wind + 0.25);

    let stopped = false;

    const pop = () => {
      if (stopped) return;
      const t = ctx.currentTime;

      // A short burst of noise for the crack.
      const frames = Math.floor(ctx.sampleRate * 0.35);
      const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i++) {
        // Decaying white noise; the taper is what stops it sounding like a hiss.
        data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.7, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      noise.connect(noiseGain).connect(master);
      noise.start(t);

      // And a low sine under it for the weight.
      const thump = ctx.createOscillator();
      thump.type = "sine";
      thump.frequency.setValueAtTime(160, t);
      thump.frequency.exponentialRampToValueAtTime(38, t + 0.45);
      const thumpGain = ctx.createGain();
      thumpGain.gain.setValueAtTime(0.9, t);
      thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      thump.connect(thumpGain).connect(master);
      thump.start(t);
      thump.stop(t + 0.55);
    };

    const stop = () => {
      if (stopped) return;
      stopped = true;
      try {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        setTimeout(() => void ctx.close().catch(() => {}), 700);
      } catch {
        /* already gone */
      }
    };

    return { pop, stop };
  } catch {
    return NO_SOUND;
  }
}
