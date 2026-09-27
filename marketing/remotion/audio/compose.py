"""Original, royalty-free soundtrack + SFX for the TanitMarket promo.

Everything is synthesised here (no samples): a Karplus-Strong plucked string
stands in for the oud, a darbuka plays the maqsum rhythm, over a D-hijaz
progression (D - Gm - Cm - D) at 120 BPM. One bar = 2 s, and the section
changes land on the scene cuts defined in src/timeline.json.

Run: python3 audio/compose.py   (needs numpy) -> writes public/audio/*.wav
"""
import json, os, wave
import numpy as np

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'public', 'audio')
TL = json.load(open(os.path.join(HERE, '..', 'src', 'timeline.json')))
TOTAL = TL['totalFrames'] / TL['fps']          # 54 s
BEAT = 0.5
BAR = 4 * BEAT
rng = np.random.default_rng(7)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def buf(sec):
    return np.zeros(int(sec * SR) + SR)


def add(track, t, sig, gain=1.0):
    i = int(t * SR)
    j = min(len(track), i + len(sig))
    if j > i:
        track[i:j] += sig[: j - i] * gain


def lp_fast(x, cutoff):
    """Cheap FIR lowpass (windowed sinc) — fast enough for long buffers."""
    taps = 101
    fc = cutoff / SR
    n = np.arange(taps) - (taps - 1) / 2
    h = np.sinc(2 * fc * n) * np.hamming(taps)
    h /= h.sum()
    return np.convolve(x, h, mode='same')


def hp_fast(x, cutoff):
    return x - lp_fast(x, cutoff)


def env_ad(n, attack, decay):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / decay)


# ---------------------------------------------------------------- instruments
def pluck(freq, dur, bright=0.55, decay=0.996):
    """Karplus-Strong string, block-vectorised. Oud-ish with a body tone."""
    n = int(dur * SR)
    N = max(2, int(SR / freq))
    y = np.zeros(n + N)
    burst = rng.uniform(-1, 1, N)
    burst = bright * burst + (1 - bright) * np.convolve(burst, np.ones(4) / 4, 'same')
    y[:N] = burst
    k = N
    while k < n + N:
        end = min(k + N, n + N)
        seg = y[k - N:end - N]
        prev = y[k - N - 1:end - N - 1] if k - N - 1 >= 0 else np.concatenate(([0], seg[:-1]))
        if len(prev) < len(seg):
            prev = np.concatenate(([0], seg[:-1]))
        y[k:end] = decay * 0.5 * (seg + prev)
        k = end
    y = y[N:N + n]
    t = np.arange(n) / SR
    body = 0.25 * np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.25)
    out = (y + body) * np.minimum(1, (n - np.arange(n)) / (0.02 * SR))
    return out


def pad(freqs, dur, cutoff=1800):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):
            ph = rng.uniform(0, 1)
            s += 2 * (((f * 2 ** (det / 12)) * t + ph) % 1.0) - 1
    s /= len(freqs) * 3
    s = lp_fast(s, cutoff)
    fade = np.minimum(1, t / 0.35) * np.minimum(1, (dur - t) / 0.35)
    return s * fade


def bass(freq, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(4 * np.pi * freq * t) + 0.15 * np.sign(np.sin(2 * np.pi * freq * t))
    return s * env_ad(n, 0.005, dur * 0.9) * np.minimum(1, (n - np.arange(n)) / (0.01 * SR))


def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.16) * 1.1


def doum():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 95 + 40 * np.exp(-t / 0.02)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-t / 0.18) + 0.1 * rng.uniform(-1, 1, n) * np.exp(-t / 0.01)) * 0.9


def tek(level=1.0):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    noise = hp_fast(rng.uniform(-1, 1, n), 2500)
    ring = np.sin(2 * np.pi * 820 * t) * 0.5
    return (noise + ring) * np.exp(-t / 0.028) * 0.55 * level


def clap():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    noise = hp_fast(rng.uniform(-1, 1, n), 1200)
    e = np.exp(-t / 0.06)
    for d in (0.0, 0.011, 0.022):
        e += 0.6 * (t >= d) * np.exp(-np.clip(t - d, 0, None) / 0.008)
    return noise * e * 0.35


def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR)
    t = np.arange(n) / SR
    return hp_fast(rng.uniform(-1, 1, n), 7000) * np.exp(-t / (0.08 if open_ else 0.015)) * 0.3


def crash():
    n = int(2.5 * SR)
    t = np.arange(n) / SR
    return hp_fast(rng.uniform(-1, 1, n), 4000) * np.exp(-t / 0.7) * 0.35


def riser(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = rng.uniform(-1, 1, n)
    # sweep: blend from low-passed to bright noise, rising level
    lo = lp_fast(noise, 600)
    mix = (t / dur)
    s = (lo * (1 - mix) + hp_fast(noise, 2000) * mix) * (t / dur) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / dur) ** 2) / SR) * 0.15 * (t / dur) ** 2
    return (s * 0.45 + tone)


def reverb(x, sec=1.8, wet=0.25):
    n = int(sec * SR)
    t = np.arange(n) / SR
    ir = rng.uniform(-1, 1, n) * np.exp(-t / (sec / 5))
    ir = lp_fast(ir, 5000)
    ir /= np.sqrt(np.sum(ir ** 2))
    L = len(x) + n
    size = 1 << (L - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return x * (1 - wet) + y * wet * 1.4


# ---------------------------------------------------------------- score
D, Gm, Cm = 'D', 'Gm', 'Cm'
CHORDS = {D: [62, 66, 69], Gm: [55, 58, 62], Cm: [60, 63, 67]}
ROOT = {D: 38, Gm: 43, Cm: 36}
PROG = [D, Gm, Cm, D]
OVERRIDE = {24: Cm, 25: D, 26: D}

def chord_at(b):
    return OVERRIDE.get(b, PROG[b % 4])

# 4-bar melodies (beat, midi, beats) in D hijaz: D Eb F# G A Bb C
MEL_A = [(0, 74, .75), (.75, 75, .25), (1, 74, .5), (1.5, 72, .5), (2, 70, 1), (3, 69, 1),
         (4, 70, .5), (4.5, 69, .5), (5, 67, .5), (5.5, 69, .5), (6, 70, 1.5), (7.5, 67, .5),
         (8, 72, .5), (8.5, 70, .5), (9, 69, .5), (9.5, 67, .5), (10, 66, 1), (11, 67, .5), (11.5, 69, .5),
         (12, 66, .5), (12.5, 63, .5), (13, 62, 2.5)]
MEL_B = [(0, 69, .5), (.5, 69, .25), (.75, 70, .25), (1, 69, .5), (1.5, 66, .5), (2, 69, .5), (2.5, 74, 1.5),
         (4, 74, .5), (4.5, 72, .5), (5, 70, .5), (5.5, 72, .5), (6, 74, .5), (6.5, 75, .5), (7, 74, 1),
         (8, 75, .5), (8.5, 74, .5), (9, 72, .5), (9.5, 70, .5), (10, 72, .5), (10.5, 70, .5), (11, 69, 1),
         (12, 70, .5), (12.5, 69, .5), (13, 67, .5), (13.5, 66, .5), (14, 62, 2)]

# section plan by bar (bar b spans [2b, 2b+2) s)
def section(b):
    if b <= 2: return 'intro'
    if b == 3: return 'drop'
    if b <= 14: return 'groove'
    if b <= 17: return 'break'
    if b <= 23: return 'groove2'
    if b == 24: return 'build'
    return 'end'

def melody_for(b):
    """Return (phrase, bar-in-phrase, octave shift) or None."""
    if 4 <= b <= 7:  return MEL_A, b - 4, 0
    if 8 <= b <= 11: return MEL_B, b - 8, 0
    if 12 <= b <= 14: return MEL_A, b - 12, 0
    if 18 <= b <= 21: return MEL_B, b - 18, 12
    if 22 <= b <= 23: return MEL_A, b - 22, 0
    return None


def compose():
    L = TOTAL + 2
    drums, bassT, oud, padT, fx = buf(L), buf(L), buf(L), buf(L), buf(L)
    nbars = int(np.ceil(TOTAL / BAR))
    K, DO, CL = kick(), doum(), clap()

    for b in range(nbars):
        t0 = b * BAR
        sec = section(b)
        ch = chord_at(b)
        full = sec in ('drop', 'groove', 'groove2')

        # pad
        if sec != 'end':
            add(padT, t0, pad([midi(n) for n in CHORDS[ch]], BAR + 0.3, 1400 if sec in ('intro', 'break') else 2200),
                0.34 if sec in ('intro', 'break') else 0.16)

        # oud arpeggio (intro / break) or rhythmic stabs (groove)
        notes = CHORDS[ch] + [CHORDS[ch][0] + 12]
        if sec in ('intro', 'break', 'build'):
            for k in range(8):
                n = notes[[0, 1, 2, 3, 2, 1, 2, 3][k]]
                add(oud, t0 + k * BEAT / 2, pluck(midi(n), 0.9), 0.5 if sec == 'intro' else 0.3)
        elif full and melody_for(b) is None:
            for k in (0, 1.5, 3):
                add(oud, t0 + k * BEAT, pluck(midi(notes[0]), 0.6), 0.3)

        # melody
        m = melody_for(b)
        if m:
            phrase, idx, octv = m
            for beat, n, d in phrase:
                if idx * 4 <= beat < idx * 4 + 4:
                    tt = t0 + (beat - idx * 4) * BEAT
                    add(oud, tt, pluck(midi(n + octv), max(0.35, d * BEAT + 0.4), bright=0.65, decay=0.997), 0.55)

        # bass
        if full or sec in ('break', 'build'):
            r = midi(ROOT[ch])
            pattern = [(0, 1, 1), (1.5, .5, 2), (2, 1, 1), (3, .5, 1.5), (3.5, .5, 2)] if full else [(0, 2, 1), (2, 2, 1)]
            for beat, d, mul in pattern:
                add(bassT, t0 + beat * BEAT, bass(r * mul if mul != 1.5 else r * 1.5, d * BEAT), 0.5)

        # drums
        if full:
            for beat in (0, 2, 2.5):
                add(drums, t0 + beat * BEAT, K, 0.9)
            for beat in (1, 3):
                add(drums, t0 + beat * BEAT, CL, 1.0)
            for k in range(8):
                add(drums, t0 + k * BEAT / 2, hat(open_=(k == 7)), 0.5 if k % 2 else 0.25)
        # darbuka maqsum: D T . T D . T .  (+ ghost ka)
        if sec != 'end' and b >= 1:
            lvl = 0.6 if sec == 'intro' else 1.0
            if sec != 'intro':
                for beat in (0, 2):
                    add(drums, t0 + beat * BEAT, DO, 0.7 * lvl)
            for beat in (0.5, 1.5, 3):
                add(drums, t0 + beat * BEAT, tek(), 0.7 * lvl)
            for beat in (1.25, 2.75, 3.5, 3.75):
                add(drums, t0 + beat * BEAT, tek(0.45), 0.5 * lvl)

        if sec == 'build':
            for k in range(16):
                add(drums, t0 + k * BEAT / 4, tek(0.4 + 0.6 * k / 16), 0.6)

    # risers & crashes on the scene structure
    for start, dur in ((4.0, 2.0), (34.0, 2.0), (48.0, 2.0)):
        add(fx, start, riser(dur), 0.5)
    for t in (6.0, 36.0, 44.0):
        add(fx, t, crash(), 0.8)
        add(drums, t, K, 1.0)

    # final hit at 50 s: big D chord, oud strum + low boom
    add(fx, 50.0, crash(), 1.0)
    add(drums, 50.0, K, 1.2)
    add(bassT, 50.0, bass(midi(38), 3.0), 0.6)
    for k, n in enumerate([50, 57, 62, 66, 69, 74]):
        add(oud, 50.0 + k * 0.025, pluck(midi(n), 3.5, decay=0.998), 0.4)
    add(padT, 50.0, pad([midi(n) for n in (50, 62, 66, 69)], 4.0, 1600), 0.25)

    oudR = reverb(oud, 2.0, 0.3)
    padR = reverb(padT, 2.5, 0.35)
    drumsR = reverb(drums, 0.8, 0.08)

    def st(x, pan):
        return np.stack([x * np.sqrt(1 - pan), x * np.sqrt(pan)], 1)

    mix = (st(drumsR, 0.5) + st(bassT, 0.5) * 0.9 + st(oudR, 0.42) + st(padR, 0.6) + st(fx, 0.5))
    # widen pad slightly
    mix[:, 0] += np.roll(padR, 300) * 0.05
    mix[:, 1] += np.roll(padR, -300) * 0.05
    n = int(TOTAL * SR)
    mix = mix[:n]
    # fade in / out
    t = np.arange(n) / SR
    mix *= np.minimum(1, t / 0.3)[:, None]
    mix *= np.clip((TOTAL - t) / 1.5, 0, 1)[:, None]
    mix = np.tanh(mix * 1.3) / np.tanh(1.3)
    mix /= np.max(np.abs(mix)) / 0.89
    return mix


# ---------------------------------------------------------------- sfx
def sfx():
    out = {}
    n = int(0.7 * SR); t = np.arange(n) / SR
    noise = rng.uniform(-1, 1, n)
    env = np.sin(np.pi * np.clip(t / 0.7, 0, 1)) ** 2
    lo, hi = lp_fast(noise, 900), hp_fast(noise, 2500)
    w = (lo * (1 - t / 0.7) + hi * (t / 0.7)) * env
    out['whoosh'] = w / np.max(np.abs(w)) * 0.7

    n = int(0.15 * SR); t = np.arange(n) / SR
    f = 500 + 900 * np.exp(-t / 0.02)
    p = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.035)
    out['pop'] = p * 0.7

    n = int(0.06 * SR); t = np.arange(n) / SR
    c = (hp_fast(rng.uniform(-1, 1, n), 3000) * 0.6 + np.sin(2 * np.pi * 2200 * t)) * np.exp(-t / 0.008)
    out['click'] = c / np.max(np.abs(c)) * 0.6

    n = int(1.6 * SR); t = np.arange(n) / SR
    d = np.zeros(n)
    for f0, st_, g in ((1318.5, 0.0, 1.0), (1760.0, 0.09, 0.9)):
        tt = np.clip(t - st_, 0, None)
        on = t >= st_
        d += on * g * (np.sin(2 * np.pi * f0 * tt) + 0.3 * np.sin(2 * np.pi * f0 * 2.76 * tt) * np.exp(-tt / 0.1)) * np.exp(-tt / 0.45)
    out['ding'] = d / np.max(np.abs(d)) * 0.6
    return out


def write(path, x):
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    data = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    write(os.path.join(OUT, 'music.wav'), compose())
    for name, sig in sfx().items():
        write(os.path.join(OUT, f'{name}.wav'), sig)
    print('ok', sorted(os.listdir(OUT)))
