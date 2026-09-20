/**
 * The noise a box makes coming open: a ship coming down.
 *
 * Not a chime and not a drum hit. Something heavy falls out of the sky, burns
 * off its speed, hangs for a moment on its thrusters, and puts its weight on
 * the ground — then the pressure lets go and the turbines wind down. A blind
 * box is a sealed object about to stop being sealed, and an arrival is the one
 * sound that is all approach and then all impact, which is the shape of the
 * animation it sits under.
 *
 * It used to be a launch, and a launch is the wrong way round. Everything in
 * it rose — pitch, brightness, the pulse — and rising reads as departure, as
 * something getting further away at the exact moment the box is opening
 * towards you. A descent inverts all three: the engines drop as they throttle
 * against gravity, the air opens up as the thing gets close enough to hear
 * properly, and the thruster pulse slows as it stops fighting and settles.
 *
 * Two of them, because two things are happening. Every box gets a small craft:
 * one engine coming down the scale, atmosphere tearing past it, and a thud as
 * it sets down. A chase gets something with a crew on it — three detuned
 * engines falling four octaves, retro-thrusters pulsing slower as they take
 * the weight, gear hitting hard enough to ring the hull, and a long turbine
 * spin-down under escaping pressure. A rare pull that sounded like a louder
 * common one would be telling you nothing you could not already see.
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
 * four, so the gap in what you actually hear is wider than the gap here.
 * Rendered offline, the two peak at roughly 0.25 and 0.43, and the chase keeps
 * ringing for half a second after the common has settled — which is the
 * hierarchy we want, and leaves the common audible on a phone speaker rather
 * than merely technically present.
 */
const CALM_PEAK = 0.17;
const LOUD_PEAK = 0.18;

export interface OpenSound {
  /** Touchdown: the moment the box gives and the weight lands. */
  pop: () => void;
  /** Stops everything and releases the context. */
  stop: () => void;
}

const NO_SOUND: OpenSound = { pop: () => {}, stop: () => {} };

/**
 * Noise, tapered or not.
 *
 * Flat noise is the raw material for both the atmospheric roar (filtered and
 * held under the descent) and the pressure venting at touchdown (filtered and
 * swept), so the shaping is left to the filters rather than baked in here.
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

    // A descent is six overlapping layers and they will not politely take
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

    /* ------------------------------ the descent ---------------------------- */

    // The engines, throttling down against gravity. Detuned against each other
    // on purpose: two saws a few cents apart beat against one another, and that
    // beating is the whole difference between a turbine and a synthesiser
    // playing a note.
    //
    // The filter opens as the pitch falls, and the two moving opposite ways is
    // what sells the distance. Something far off is muffled because the air has
    // eaten its top end; as it closes, the top end comes back. Sweeping both
    // down together would just sound like a fade-out.
    const engineFilter = ctx.createBiquadFilter();
    engineFilter.type = "lowpass";
    engineFilter.frequency.setValueAtTime(loud ? 320 : 420, now);
    engineFilter.frequency.exponentialRampToValueAtTime(loud ? 7200 : 3200, now + wind);
    engineFilter.Q.value = loud ? 11 : 7;

    const engineGain = ctx.createGain();
    engineGain.gain.setValueAtTime(0.0001, now);
    engineGain.gain.exponentialRampToValueAtTime(loud ? 0.7 : 0.5, now + wind * 0.94);
    engineGain.gain.exponentialRampToValueAtTime(0.0001, now + wind + 0.14);
    engineFilter.connect(engineGain).connect(master);

    for (const cents of loud ? [0, 9, -11] : [0, 7]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.detune.value = cents;
      osc.frequency.setValueAtTime(loud ? 760 : 520, now);
      osc.frequency.exponentialRampToValueAtTime(loud ? 52 : 96, now + wind);
      osc.connect(engineFilter);
      osc.start(now);
      osc.stop(now + wind + 0.3);
    }

    // Atmosphere tearing past the hull. Opens from a distant muffle to a wide
    // roar, so the approach is carried by the air as much as by the engines —
    // and so the venting after touchdown lands as a release rather than as
    // simply more noise.
    const roar = ctx.createBufferSource();
    roar.buffer = noise(ctx, wind + 0.5, false);
    const roarFilter = ctx.createBiquadFilter();
    roarFilter.type = "lowpass";
    roarFilter.frequency.setValueAtTime(loud ? 180 : 220, now);
    roarFilter.frequency.exponentialRampToValueAtTime(loud ? 3400 : 1900, now + wind);
    const roarGain = ctx.createGain();
    roarGain.gain.setValueAtTime(0.0001, now);
    roarGain.gain.exponentialRampToValueAtTime(loud ? 0.75 : 0.4, now + wind * 0.9);
    roarGain.gain.exponentialRampToValueAtTime(0.0001, now + wind + 0.2);
    roar.connect(roarFilter).connect(roarGain).connect(master);
    roar.start(now);

    // Retro-thrusters, chase only: a tone chopped by an oscillator that slows
    // as the ship stops fighting its own descent. The launch version of this
    // quickened, which reads as something filling up; slowing reads as
    // something settling, and settling is what is about to happen.
    if (loud) {
      const carrier = ctx.createOscillator();
      carrier.type = "sine";
      carrier.frequency.setValueAtTime(2600, now);
      carrier.frequency.exponentialRampToValueAtTime(640, now + wind);

      // Chopper: its output is added to the gain below, so the gain swings
      // between roughly nothing and twice the base — an amplitude gate.
      const chopper = ctx.createOscillator();
      chopper.type = "sine";
      chopper.frequency.setValueAtTime(64, now);
      chopper.frequency.exponentialRampToValueAtTime(9, now + wind);
      const depth = ctx.createGain();
      depth.gain.value = 0.5;
      chopper.connect(depth);

      const chopped = ctx.createGain();
      chopped.gain.value = 0.5;
      depth.connect(chopped.gain);
      carrier.connect(chopped);

      const thrusterGain = ctx.createGain();
      thrusterGain.gain.setValueAtTime(0.0001, now);
      thrusterGain.gain.exponentialRampToValueAtTime(0.24, now + wind * 0.9);
      thrusterGain.gain.exponentialRampToValueAtTime(0.0001, now + wind + 0.1);
      chopped.connect(thrusterGain).connect(master);

      carrier.start(now);
      carrier.stop(now + wind + 0.2);
      chopper.start(now);
      chopper.stop(now + wind + 0.2);
    }

    let stopped = false;

    /* ----------------------------- touchdown ------------------------------- */

    const pop = () => {
      if (stopped) return;
      const t = ctx.currentTime;
      // Long on both, because the tail is the part that says "landed". A
      // common box that stopped dead the moment the flaps opened read as a
      // sound being cut off rather than a machine coming to rest.
      const tail = loud ? 1.5 : 1.15;

      // The weight arriving. A sine dropping into the sub, where it stops
      // being a pitch and becomes pressure — struck hard and decaying fast,
      // because gear compressing is an event and not a note.
      const impact = ctx.createOscillator();
      impact.type = "sine";
      impact.frequency.setValueAtTime(loud ? 150 : 110, t);
      impact.frequency.exponentialRampToValueAtTime(loud ? 26 : 36, t + (loud ? 0.5 : 0.3));
      const impactGain = ctx.createGain();
      impactGain.gain.setValueAtTime(loud ? 1 : 0.6, t);
      impactGain.gain.exponentialRampToValueAtTime(0.0001, t + (loud ? 0.75 : 0.42));
      impact.connect(impactGain).connect(master);
      impact.start(t);
      impact.stop(t + 1);

      // Pressure letting go. A wide band of noise swept downward and held far
      // longer than the impact that triggered it: the hiss is the part that
      // says the thing has stopped moving, and it is still going when the
      // piece is standing there.
      const vent = ctx.createBufferSource();
      vent.buffer = noise(ctx, tail, true);
      const ventFilter = ctx.createBiquadFilter();
      ventFilter.type = "bandpass";
      ventFilter.Q.value = 0.9;
      ventFilter.frequency.setValueAtTime(loud ? 6200 : 4200, t);
      ventFilter.frequency.exponentialRampToValueAtTime(loud ? 420 : 620, t + tail);
      const ventGain = ctx.createGain();
      ventGain.gain.setValueAtTime(0.0001, t);
      ventGain.gain.exponentialRampToValueAtTime(loud ? 0.8 : 0.45, t + 0.05);
      ventGain.gain.exponentialRampToValueAtTime(0.0001, t + tail);
      vent.connect(ventFilter).connect(ventGain).connect(master);
      vent.start(t);

      // Every box gets its turbines winding down; a chase just gets more of
      // everything else on top. A landing without a spin-down is a thud.
      const spindown = ctx.createOscillator();
      spindown.type = "sawtooth";
      spindown.frequency.setValueAtTime(loud ? 900 : 620, t + 0.06);
      spindown.frequency.exponentialRampToValueAtTime(loud ? 58 : 74, t + (loud ? 1.3 : 0.95));
      const spinFilter = ctx.createBiquadFilter();
      spinFilter.type = "lowpass";
      spinFilter.frequency.setValueAtTime(loud ? 5200 : 3200, t + 0.06);
      spinFilter.frequency.exponentialRampToValueAtTime(loud ? 320 : 400, t + (loud ? 1.3 : 0.95));
      spinFilter.Q.value = loud ? 7 : 5;
      const spinGain = ctx.createGain();
      spinGain.gain.setValueAtTime(0.0001, t + 0.06);
      spinGain.gain.exponentialRampToValueAtTime(loud ? 0.5 : 0.3, t + 0.16);
      spinGain.gain.exponentialRampToValueAtTime(0.0001, t + (loud ? 1.45 : 1.05));
      spindown.connect(spinFilter).connect(spinGain).connect(master);
      spindown.start(t + 0.06);
      spindown.stop(t + (loud ? 1.5 : 1.1));

      if (!loud) return;

      // Gear on the ground. Three inharmonic partials with no attack to speak
      // of and a very short decay — struck metal, not a tuned bell. Detuned
      // off any common interval on purpose: anything that lands on a chord
      // stops being an impact and starts being a note.
      for (const [freq, level] of [
        [1870, 0.5],
        [2630, 0.34],
        [3910, 0.22],
      ] as const) {
        const clank = ctx.createOscillator();
        clank.type = "triangle";
        clank.frequency.setValueAtTime(freq, t);
        clank.frequency.exponentialRampToValueAtTime(freq * 0.92, t + 0.18);
        const clankGain = ctx.createGain();
        clankGain.gain.setValueAtTime(0.0001, t);
        clankGain.gain.exponentialRampToValueAtTime(level, t + 0.006);
        clankGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        clank.connect(clankGain).connect(master);
        clank.start(t);
        clank.stop(t + 0.35);
      }

      // And the hull still ringing afterwards. Two high sines sliding a little
      // flat as the metal cools — a ring that holds dead still sounds
      // synthetic, and this one has just been hit.
      for (const freq of [2400, 3600]) {
        const ring = ctx.createOscillator();
        ring.type = "sine";
        ring.frequency.setValueAtTime(freq, t);
        ring.frequency.exponentialRampToValueAtTime(freq * 0.97, t + 1.6);
        const ringGain = ctx.createGain();
        ringGain.gain.setValueAtTime(0.0001, t);
        ringGain.gain.exponentialRampToValueAtTime(0.13, t + 0.03);
        ringGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
        ring.connect(ringGain).connect(master);
        ring.start(t);
        ring.stop(t + 1.8);
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
