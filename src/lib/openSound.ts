/**
 * The noise a box makes coming open: a ship leaving the ground.
 *
 * Not a chime and not a drum hit. Turbines spooling, a reactor charging, a
 * sub-bass rumble that arrives before you can name it, and then the thing
 * tears off the pad and goes past you. A blind box is a sealed object that
 * is about to stop being sealed, and a launch is the only sound that is all
 * anticipation and then all release, which is the shape of the animation it
 * has to sit under.
 *
 * Two of them, because two things are happening. Every box gets a small
 * craft: one engine spooling, a short rumble, a whoosh as it lifts. A chase
 * gets something with a crew on it — three detuned engines climbing four
 * octaves, a reactor pulsing faster as it charges, and an ignition that
 * drops half a kilohertz past your ear and leaves a metallic ring behind.
 * A rare pull that sounded like a louder common one would be telling you
 * nothing you could not already see.
 *
 * Synthesised rather than shipped as files: this is all sweeps and filtered
 * noise, which a handful of oscillators make, and that beats adding binary
 * assets — and the downloads for them — to every page load.
 *
 * Browsers refuse to start audio without a gesture, so this must be called
 * from the tap that opens the box. If it is blocked anyway, or the API is
 * missing, the whole thing fails quietly: no pull should ever break because
 * a speaker would not co-operate.
 */

/**
 * The chase is allowed to be the louder one, but not by as much as these
 * numbers suggest: a chase is six layers summing together and a common box is
 * three, so the gap in what you actually hear is far wider than the gap here.
 * Rendered offline, the two peak at roughly 0.24 and 0.62 — which is the
 * hierarchy we want, and leaves the common audible on a phone speaker rather
 * than technically present.
 */
const CALM_PEAK = 0.17;
const LOUD_PEAK = 0.18;

export interface OpenSound {
  /** Ignition: the moment the box gives and the ship leaves. */
  pop: () => void;
  /** Stops everything and releases the context. */
  stop: () => void;
}

const NO_SOUND: OpenSound = { pop: () => {}, stop: () => {} };

/**
 * Noise, tapered or not.
 *
 * Flat noise is the raw material for both the thrust rumble (filtered low
 * and held) and the liftoff whoosh (filtered wide and swept), so the shaping
 * is left to the filters rather than baked in here.
 */
function noise(ctx: BaseAudioContext, seconds: number, decay: boolean): AudioBuffer {
  const frames = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    const raw = Math.random() * 2 - 1;
    data[i] = decay ? raw * (1 - i / frames) ** 1.6 : raw;
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
    const wind = Math.max(0.2, windMs / 1000);

    // A launch is six overlapping layers and they will not politely take
    // turns. Without this the sum clips on the loud one and the clipping is
    // what you hear instead of the ship.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 12;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    limiter.connect(ctx.destination);

    const master = ctx.createGain();
    master.gain.value = loud ? LOUD_PEAK : CALM_PEAK;
    master.connect(limiter);

    /* ----------------------------- the spool-up ---------------------------- */

    // The engines. Detuned against each other on purpose: two saws a few
    // cents apart beat against one another, and that beating is the whole
    // difference between a turbine and a synthesiser playing a note.
    const engineFilter = ctx.createBiquadFilter();
    engineFilter.type = "lowpass";
    engineFilter.frequency.setValueAtTime(200, now);
    engineFilter.frequency.exponentialRampToValueAtTime(loud ? 7000 : 2600, now + wind);
    engineFilter.Q.value = loud ? 12 : 8;

    const engineGain = ctx.createGain();
    engineGain.gain.setValueAtTime(0.0001, now);
    engineGain.gain.exponentialRampToValueAtTime(loud ? 0.7 : 0.5, now + wind * 0.94);
    engineGain.gain.exponentialRampToValueAtTime(0.0001, now + wind + 0.14);
    engineFilter.connect(engineGain).connect(master);

    for (const cents of loud ? [0, 9, -11] : [0, 7]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.detune.value = cents;
      osc.frequency.setValueAtTime(loud ? 55 : 70, now);
      osc.frequency.exponentialRampToValueAtTime(loud ? 900 : 420, now + wind);
      osc.connect(engineFilter);
      osc.start(now);
      osc.stop(now + wind + 0.3);
    }

    // Thrust. Everything above a few hundred hertz stripped off, so it is
    // felt more than heard — which is what makes the whoosh at ignition land
    // as a release rather than as another noise.
    const rumble = ctx.createBufferSource();
    rumble.buffer = noise(ctx, wind + 0.5, false);
    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = "lowpass";
    rumbleFilter.frequency.setValueAtTime(loud ? 120 : 160, now);
    rumbleFilter.frequency.exponentialRampToValueAtTime(loud ? 520 : 400, now + wind);
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.0001, now);
    rumbleGain.gain.exponentialRampToValueAtTime(loud ? 0.8 : 0.4, now + wind * 0.9);
    rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + wind + 0.2);
    rumble.connect(rumbleFilter).connect(rumbleGain).connect(master);
    rumble.start(now);

    // The reactor, chase only: a high tone chopped by an oscillator that
    // speeds up as the charge builds. A steady pulse reads as a warning
    // light; one that quickens reads as something filling up.
    if (loud) {
      const carrier = ctx.createOscillator();
      carrier.type = "sine";
      carrier.frequency.setValueAtTime(1800, now);
      carrier.frequency.exponentialRampToValueAtTime(3000, now + wind);

      // Chopper: its output is added to the gain below, so the gain swings
      // between roughly nothing and twice the base — an amplitude gate.
      const chopper = ctx.createOscillator();
      chopper.type = "sine";
      chopper.frequency.setValueAtTime(18, now);
      chopper.frequency.exponentialRampToValueAtTime(70, now + wind);
      const depth = ctx.createGain();
      depth.gain.value = 0.5;
      chopper.connect(depth);

      const chopped = ctx.createGain();
      chopped.gain.value = 0.5;
      depth.connect(chopped.gain);
      carrier.connect(chopped);

      const reactorGain = ctx.createGain();
      reactorGain.gain.setValueAtTime(0.0001, now);
      reactorGain.gain.exponentialRampToValueAtTime(0.22, now + wind * 0.9);
      reactorGain.gain.exponentialRampToValueAtTime(0.0001, now + wind + 0.1);
      chopped.connect(reactorGain).connect(master);

      carrier.start(now);
      carrier.stop(now + wind + 0.2);
      chopper.start(now);
      chopper.stop(now + wind + 0.2);
    }

    let stopped = false;

    /* ------------------------------ ignition ------------------------------- */

    const pop = () => {
      if (stopped) return;
      const t = ctx.currentTime;
      const tail = loud ? 0.9 : 0.5;

      // Liftoff. A wide band of noise swept from the top of the spectrum to
      // the bottom, which is a ship going away from you rather than a door
      // being slammed.
      const whoosh = ctx.createBufferSource();
      whoosh.buffer = noise(ctx, tail, true);
      const whooshFilter = ctx.createBiquadFilter();
      whooshFilter.type = "bandpass";
      whooshFilter.Q.value = 1.1;
      whooshFilter.frequency.setValueAtTime(loud ? 5000 : 3000, t);
      whooshFilter.frequency.exponentialRampToValueAtTime(loud ? 200 : 320, t + tail);
      const whooshGain = ctx.createGain();
      whooshGain.gain.setValueAtTime(loud ? 0.95 : 0.5, t);
      whooshGain.gain.exponentialRampToValueAtTime(0.0001, t + tail);
      whoosh.connect(whooshFilter).connect(whooshGain).connect(master);
      whoosh.start(t);

      // The pad taking it. A sine falling into the sub, where it stops being
      // a pitch and becomes pressure.
      const boom = ctx.createOscillator();
      boom.type = "sine";
      boom.frequency.setValueAtTime(loud ? 120 : 90, t);
      boom.frequency.exponentialRampToValueAtTime(loud ? 28 : 38, t + (loud ? 0.8 : 0.4));
      const boomGain = ctx.createGain();
      boomGain.gain.setValueAtTime(loud ? 1 : 0.55, t);
      boomGain.gain.exponentialRampToValueAtTime(0.0001, t + (loud ? 0.9 : 0.45));
      boom.connect(boomGain).connect(master);
      boom.start(t);
      boom.stop(t + 1);

      if (!loud) return;

      // The flyby. The engines, an octave and a half up, dropping past the
      // ear — the Doppler is the whole trick, and it is why this reads as
      // something leaving rather than something arriving.
      const flyby = ctx.createOscillator();
      flyby.type = "sawtooth";
      flyby.frequency.setValueAtTime(1400, t);
      flyby.frequency.exponentialRampToValueAtTime(180, t + 0.62);
      const flybyFilter = ctx.createBiquadFilter();
      flybyFilter.type = "lowpass";
      flybyFilter.frequency.setValueAtTime(6000, t);
      flybyFilter.frequency.exponentialRampToValueAtTime(700, t + 0.62);
      flybyFilter.Q.value = 6;
      const flybyGain = ctx.createGain();
      flybyGain.gain.setValueAtTime(0.0001, t);
      flybyGain.gain.exponentialRampToValueAtTime(0.6, t + 0.04);
      flybyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      flyby.connect(flybyFilter).connect(flybyGain).connect(master);
      flyby.start(t);
      flyby.stop(t + 0.8);

      // And the ring it leaves in the hull. Two high sines, no attack worth
      // the name, decaying long — the only part of a chase that is still
      // sounding when the piece is standing there.
      for (const freq of [2400, 3600]) {
        const ring = ctx.createOscillator();
        ring.type = "sine";
        ring.frequency.setValueAtTime(freq, t);
        const ringGain = ctx.createGain();
        ringGain.gain.setValueAtTime(0.0001, t);
        ringGain.gain.exponentialRampToValueAtTime(0.14, t + 0.03);
        ringGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
        ring.connect(ringGain).connect(master);
        ring.start(t);
        ring.stop(t + 1.7);
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
