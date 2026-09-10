/**
 * The noise a box makes coming open.
 *
 * Two of them, because two things are happening. Every box gets a short,
 * low swell and a soft thump as the flaps give — enough that opening one
 * feels like an event rather than a page transition. A chase gets something
 * else entirely: a ladder of bell tones climbing over a swelling pad, then a
 * chime on the hit. The difference is deliberate and it is the point. If the
 * rare pull sounded like a louder version of the common one, the sound would
 * be telling you nothing you could not already see.
 *
 * Synthesised rather than shipped as files: these are risers and hits, which
 * a handful of oscillators make, and that beats adding binary assets — and
 * the downloads for them — to every page load.
 *
 * Browsers refuse to start audio without a gesture, so this must be called
 * from the tap that opens the box. If it is blocked anyway, or the API is
 * missing, the whole thing fails quietly: no pull should ever break because
 * a speaker would not co-operate.
 */

/** Kept modest on purpose. The chase is allowed to be the louder one. */
const CALM_PEAK = 0.1;
const LOUD_PEAK = 0.17;

/** Steps in the chase's ladder — one every other swing of the rattle. */
const LADDER_STEPS = 12;
/** Three semitones a step, so the climb reads as an arpeggio, not a siren. */
const LADDER_ROOT = 262;

export interface OpenSound {
  /** The moment the box gives: a hit under whatever was building. */
  pop: () => void;
  /** Stops everything and releases the context. */
  stop: () => void;
}

const NO_SOUND: OpenSound = { pop: () => {}, stop: () => {} };

/** A burst of decaying white noise — the board itself, tearing. */
function noiseBurst(ctx: AudioContext, seconds: number): AudioBuffer {
  const frames = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    // The taper is what stops it sounding like a hiss.
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2;
  }
  return buffer;
}

export function playOpenSound(windMs: number, { loud }: { loud: boolean }): OpenSound {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return NO_SOUND;

    const ctx = new Ctor();
    const now = ctx.currentTime;
    const wind = windMs / 1000;

    const master = ctx.createGain();
    master.gain.value = loud ? LOUD_PEAK : CALM_PEAK;
    master.connect(ctx.destination);

    /* ------------------------------- the wait ------------------------------ */

    // Under everything, for both: a low swell. On its own this is the whole
    // of a common opening — a room filling up rather than a note being
    // played, which is as much as an ordinary box should announce.
    const pad = ctx.createOscillator();
    pad.type = "triangle";
    pad.frequency.setValueAtTime(loud ? 55 : 90, now);
    pad.frequency.exponentialRampToValueAtTime(loud ? 110 : 300, now + wind);

    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.setValueAtTime(400, now);
    padFilter.frequency.exponentialRampToValueAtTime(loud ? 3200 : 2000, now + wind);
    padFilter.Q.value = loud ? 4 : 1.2;

    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0.0001, now);
    padGain.gain.exponentialRampToValueAtTime(loud ? 0.75 : 0.55, now + wind * 0.92);
    padGain.gain.exponentialRampToValueAtTime(0.0001, now + wind + 0.12);

    pad.connect(padFilter).connect(padGain).connect(master);
    pad.start(now);
    pad.stop(now + wind + 0.25);

    // And, for a chase only, the ladder: short bell tones climbing a minor
    // third at a time, each one louder than the last. This is the tell. It
    // is scheduled up front rather than driven by a timer, so it stays in
    // step with the rattle even if the tab stutters.
    if (loud) {
      const gap = wind / LADDER_STEPS;
      for (let i = 0; i < LADDER_STEPS; i++) {
        const at = now + i * gap;
        const freq = LADDER_ROOT * 2 ** (i / 4);
        const ring = Math.min(0.26, gap * 1.6);

        const tone = ctx.createOscillator();
        tone.type = "sine";
        tone.frequency.setValueAtTime(freq, at);

        // A detuned partial an octave up, quiet, to give each step an edge —
        // a bare sine reads as a test tone rather than a bell.
        const partial = ctx.createOscillator();
        partial.type = "sine";
        partial.frequency.setValueAtTime(freq * 2.01, at);

        const partialGain = ctx.createGain();
        partialGain.gain.value = 0.28;
        partial.connect(partialGain);

        const step = ctx.createGain();
        step.gain.setValueAtTime(0.0001, at);
        step.gain.exponentialRampToValueAtTime(0.16 + (i / LADDER_STEPS) * 0.5, at + 0.012);
        step.gain.exponentialRampToValueAtTime(0.0001, at + ring);

        tone.connect(step);
        partialGain.connect(step);
        step.connect(master);

        tone.start(at);
        tone.stop(at + ring + 0.02);
        partial.start(at);
        partial.stop(at + ring + 0.02);
      }
    }

    let stopped = false;

    /* ------------------------------- the hit ------------------------------- */

    const pop = () => {
      if (stopped) return;
      const t = ctx.currentTime;

      // The board giving. Shorter and duller for a common box — a carton
      // opening, not an explosion.
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBurst(ctx, loud ? 0.35 : 0.18);
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = loud ? "highpass" : "bandpass";
      noiseFilter.frequency.value = loud ? 900 : 1800;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(loud ? 0.7 : 0.45, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + (loud ? 0.35 : 0.18));
      noise.connect(noiseFilter).connect(noiseGain).connect(master);
      noise.start(t);

      // A low sine under it for the weight.
      const thump = ctx.createOscillator();
      thump.type = "sine";
      thump.frequency.setValueAtTime(loud ? 180 : 120, t);
      thump.frequency.exponentialRampToValueAtTime(loud ? 38 : 52, t + 0.45);
      const thumpGain = ctx.createGain();
      thumpGain.gain.setValueAtTime(loud ? 0.9 : 0.5, t);
      thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + (loud ? 0.5 : 0.3));
      thump.connect(thumpGain).connect(master);
      thump.start(t);
      thump.stop(t + 0.55);

      // And, for a chase, the chord the ladder was climbing toward. The
      // common box gets no note at all here: the ordinary opening ends on a
      // thump, and that restraint is what leaves the chime somewhere to go.
      if (loud) {
        for (const freq of [880, 1320, 1760]) {
          const chime = ctx.createOscillator();
          chime.type = "sine";
          chime.frequency.setValueAtTime(freq, t);
          const chimeGain = ctx.createGain();
          chimeGain.gain.setValueAtTime(0.0001, t);
          chimeGain.gain.exponentialRampToValueAtTime(0.3, t + 0.015);
          chimeGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
          chime.connect(chimeGain).connect(master);
          chime.start(t);
          chime.stop(t + 1.2);
        }
      }
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
