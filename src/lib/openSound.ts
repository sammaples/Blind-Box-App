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
const CALM_PEAK = 0.12;
const LOUD_PEAK = 0.13;

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
    // turns, so there has to be something catching the sum. But a compressor
    // is a terrible neighbour for a hover: releasing over a quarter of a
    // second, it tracks a pulse at five hertz and irons it flat — which is
    // precisely what happened, and why deepening the wah upstream kept coming
    // back measuring no deeper.
    //
    // So it is a safety net now rather than a leveller. It sits high enough to
    // ignore the body of the sound, leans gently when it does engage, and
    // releases slowly enough to act as one steady gain across the whole thing
    // instead of breathing in time with the thrusters. The layers below were
    // brought down to meet it.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 6;
    limiter.ratio.value = 4;
    limiter.attack.value = 0.01;
    limiter.release.value = 0.9;
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

    // Two stages, and the first one is short on purpose. A single exponential
    // from silence to full spends almost all of its length inaudible — the old
    // one measured 0.0001 RMS a fifth of the way through a wind the listener
    // was already watching the box shake through. Reaching a real level fast
    // and then climbing from there is what makes the sound arrive with the
    // shake rather than a beat before the flaps.
    const engineGain = ctx.createGain();
    engineGain.gain.setValueAtTime(0.0001, now);
    engineGain.gain.exponentialRampToValueAtTime(loud ? 0.14 : 0.11, now + wind * 0.1);
    engineGain.gain.exponentialRampToValueAtTime(loud ? 0.34 : 0.26, now + wind * 0.94);
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
    roarGain.gain.exponentialRampToValueAtTime(loud ? 0.16 : 0.1, now + wind * 0.08);
    roarGain.gain.exponentialRampToValueAtTime(loud ? 0.4 : 0.22, now + wind * 0.9);
    roarGain.gain.exponentialRampToValueAtTime(0.0001, now + wind + 0.2);
    roar.connect(roarFilter).connect(roarGain).connect(master);
    roar.start(now);

    // The hover.
    //
    // Wah, wah, wah — and it is a filter doing it, not the volume. A tremolo
    // just turns a steady tone on and off, which reads as a warning light; a
    // resonant filter swept up and down changes which harmonics survive, and
    // that vowel-like movement is the sound of something holding itself in the
    // air on thrust it keeps adjusting. It is the same trick as a wah pedal,
    // for the same reason: the interest is in the sweep, not the level.
    //
    // Every tier gets it. Hovering is what the craft is doing while the box
    // shakes, whatever is inside.
    // A resonant lowpass, not a bandpass. A bandpass with enough Q to make a
    // vowel throws away everything outside a narrow slice, and measured
    // against the rest of the mix the first version of this landed 18 dB down
    // — one per cent of what you were hearing. It swept beautifully and was
    // completely inaudible. A lowpass passes everything under the cutoff plus
    // a resonant peak at it, which is both how a wah pedal actually works and
    // loud enough to survive company.
    const hoverFilter = ctx.createBiquadFilter();
    hoverFilter.type = "lowpass";
    hoverFilter.frequency.value = loud ? 1550 : 1400;
    hoverFilter.Q.value = loud ? 17 : 16;

    // About six sweeps a second on a common box, easing off as the craft
    // settles — enough wahs to read as a rhythm inside a wind this short
    // rather than as one slow wobble, and slow enough that each one is a
    // separate word.
    //
    // The chase hovers *slower*, not faster. Its wind is more than twice as
    // long, so a quicker pulse across it came out as a flutter, and a flutter
    // is a small thing. Weight sounds unhurried: the bigger craft takes its
    // time adjusting, and gets more wahs anyway simply by hanging there longer.
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(loud ? 4.4 : 5.8, now);
    lfo.frequency.exponentialRampToValueAtTime(loud ? 2.6 : 4.2, now + wind);
    // Wide enough that the bottom of each sweep takes the cutoff below the
    // voices themselves. A shallower sweep only changes which upper harmonics
    // survive, and measured that came out as a 21% wobble — audible if you are
    // told it is there, which is not the same as hearing it.
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = loud ? 1350 : 1250;
    lfo.connect(lfoDepth).connect(hoverFilter.frequency);

    // The same LFO on the level, too. A wah is a timbre change and a pure
    // tremolo is a cheap substitute for one — but a little amplitude moving in
    // step with the filter is what a real thruster does as it loads and
    // unloads, and it is what takes this from something you can measure to
    // something you can hear. An AudioParam sums its automation with whatever
    // is connected to it, so this rides on the ramps below rather than
    // replacing them.
    const lfoLevel = ctx.createGain();
    lfoLevel.gain.value = loud ? 0.62 : 0.58;
    lfo.connect(lfoLevel);

    const hoverGain = ctx.createGain();
    hoverGain.gain.setValueAtTime(0.0001, now);
    hoverGain.gain.exponentialRampToValueAtTime(loud ? 0.55 : 0.5, now + wind * 0.09);
    hoverGain.gain.exponentialRampToValueAtTime(loud ? 0.85 : 0.75, now + wind * 0.9);
    hoverGain.gain.exponentialRampToValueAtTime(0.0001, now + wind + 0.12);
    lfoLevel.connect(hoverGain.gain);
    hoverFilter.connect(hoverGain).connect(master);

    // Two voices a fifth apart so the sweep has something to bite on: a single
    // saw through a narrow band gives the filter one harmonic series to chew,
    // and the wah barely registers.
    for (const freq of loud ? [110, 165, 82] : [130, 196]) {
      const voice = ctx.createOscillator();
      voice.type = "sawtooth";
      voice.frequency.setValueAtTime(freq, now);
      voice.frequency.exponentialRampToValueAtTime(freq * 0.72, now + wind);
      voice.connect(hoverFilter);
      voice.start(now);
      voice.stop(now + wind + 0.25);
    }
    lfo.start(now);
    lfo.stop(now + wind + 0.25);

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

      // And the thing actually opening.
      //
      // Everything else at touchdown falls — the impact into the sub, the vent
      // down the spectrum, the turbines spinning down — because that is what
      // arriving sounds like. But the box is opening at this exact moment, and
      // an opening is the one gesture in the whole sound that should go *up*.
      //
      // Two parts, both short. A seal letting go: a sharp band of noise swept
      // hard upward, which is pressure finding a gap rather than escaping
      // through one. Then the hatch itself — a bright pair of partials rising
      // a fifth, quick enough to be a movement rather than a note.
      const seal = ctx.createBufferSource();
      seal.buffer = noise(ctx, 0.34, true);
      const sealFilter = ctx.createBiquadFilter();
      sealFilter.type = "bandpass";
      sealFilter.Q.value = 3.2;
      sealFilter.frequency.setValueAtTime(520, t);
      sealFilter.frequency.exponentialRampToValueAtTime(loud ? 8200 : 6400, t + 0.3);
      const sealGain = ctx.createGain();
      sealGain.gain.setValueAtTime(0.0001, t);
      sealGain.gain.exponentialRampToValueAtTime(loud ? 0.55 : 0.4, t + 0.03);
      sealGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      seal.connect(sealFilter).connect(sealGain).connect(master);
      seal.start(t);

      for (const [freq, level] of [
        [660, 0.3],
        [990, 0.2],
      ] as const) {
        const hatch = ctx.createOscillator();
        hatch.type = "triangle";
        hatch.frequency.setValueAtTime(freq, t + 0.02);
        hatch.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.26);
        const hatchGain = ctx.createGain();
        hatchGain.gain.setValueAtTime(0.0001, t + 0.02);
        hatchGain.gain.exponentialRampToValueAtTime(level, t + 0.06);
        hatchGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
        hatch.connect(hatchGain).connect(master);
        hatch.start(t + 0.02);
        hatch.stop(t + 0.38);
      }

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
