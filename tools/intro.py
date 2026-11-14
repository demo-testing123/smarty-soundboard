"""Baut die Eröffnung „Die Zukunft braucht euch“ als EINE Sequenz:
Erzähler-Abschnitte (von generate.py erzeugt) + selbst synthetisierte Musik + Effekte,
nach der Musik- und Soundregie aus dem Intro-PDF. Es werden keine fremden Samples
verwendet – jeder Ton wird hier berechnet (frei für öffentliche Aufführungen).

Aufruf (nach generate.py):
    python tools/intro.py          # nur wenn sich Erzählerteile oder Einstellungen geändert haben
    python tools/intro.py --neu    # immer neu bauen

Ergebnis in audio/intro/:
    Eroeffnung_mit_Musik.mp3       fertige Mischung (Stereo)
    Spur_Sprecher.mp3 / Spur_Musik.mp3 / Spur_Effekte.mp3   getrennte Spuren, z. B. für Audacity
    Regie.md                       tatsächliche Zeitmarken aller Einsätze

Optionen am Sequenz-Eintrag in sounds.json:
    "vorlauf": 3.2                 Musik vor dem ersten Wort (s)
    "pausen": [2.4, 2.0, 2.4, 2.0, 2.6]   Pause zwischen den Abschnitten (s)
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from scipy import signal

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate as G  # noqa: E402

MUSIK_VERSION = "1"
SR = 44100
ROOT = G.ROOT
OUTDIR = G.AUDIO / "intro"
MIX_NAME = "Eroeffnung_mit_Musik.mp3"
DUCK_DB = 10.0          # Musik unter Sprache leiser
MUSIK_UNTER_STIMME = 4  # Musik in Sprechpausen so viel dB unter der Stimme
TAIL = 4.5

rng = np.random.default_rng(2050)


# ---------------------------------------------------------------- Grundbausteine
def secs(t: float) -> int:
    return int(round(t * SR))


def mtof(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def stereo(x: np.ndarray) -> np.ndarray:
    return x if x.ndim == 2 else np.stack([x, x])


def add(buf: np.ndarray, x: np.ndarray, t: float, gain: float = 1.0) -> None:
    x = stereo(x)
    i = secs(t)
    if i < 0:
        x, i = x[:, -i:], 0
    j = min(buf.shape[1], i + x.shape[1])
    if j > i:
        buf[:, i:j] += gain * x[:, : j - i]


def env_ar(n: int, a: float, r: float) -> np.ndarray:
    e = np.ones(n)
    na = min(n, secs(a))
    nr = min(n - na, secs(r))
    if na:
        e[:na] = np.linspace(0, 1, na) ** 1.5
    if nr:
        e[n - nr:] *= np.linspace(1, 0, nr) ** 1.5
    return e


def dec(n: int, tau: float) -> np.ndarray:
    return np.exp(-np.arange(n) / (tau * SR))


def saw(f, n: int, phase0: float = 0.0) -> np.ndarray:
    """Bandbegrenzte Sägezahnwelle (polyBLEP)."""
    dt = np.broadcast_to(np.asarray(f, dtype=float) / SR, (n,))
    ph = (phase0 + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    t = ph[m] / dt[m]
    y[m] -= t + t - t * t - 1
    m = ph > 1 - dt
    t = (ph[m] - 1) / dt[m]
    y[m] -= t * t + t + t + 1
    return y


def sosf(x, kind, fc, order=2):
    sos = signal.butter(order, fc, kind, fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=-1)


def lp(x, fc, order=2):
    return sosf(x, "low", fc, order)


def hp(x, fc, order=2):
    return sosf(x, "high", fc, order)


def bp(x, lo, hi, order=2):
    return sosf(x, "band", [lo, hi], order)


def lp_sweep(x: np.ndarray, fc_start: float, fc_end: float) -> np.ndarray:
    """Tiefpass mit exponentiell wanderndem Cutoff (blockweise)."""
    x = stereo(x)
    out = np.empty_like(x)
    n = x.shape[1]
    B = 512
    zi = np.zeros((2, 2, 2))
    for k in range(0, n, B):
        fc = fc_start * (fc_end / fc_start) ** (k / max(1, n - 1))
        sos = signal.butter(4, min(fc, SR * 0.45), "low", fs=SR, output="sos")
        for c in range(2):
            out[c, k:k + B], zi[c] = signal.sosfilt(sos, x[c, k:k + B], zi=zi[c])
    return out


def noise(n: int) -> np.ndarray:
    return rng.standard_normal(n)


def make_ir(rt60: float = 2.4, pre: float = 0.025, seed: int = 7) -> np.ndarray:
    r = np.random.default_rng(seed)
    n = secs(rt60 * 1.2)
    t = np.arange(n) / SR
    ir = r.standard_normal((2, n)) * np.exp(-6.9 * t / rt60)
    ir = lp(ir, 5500)
    ir[:, : secs(pre)] = 0
    ir[:, secs(pre): secs(pre + 0.06)] *= np.linspace(0, 1, secs(0.06))
    return ir / np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))


IR = make_ir()


def reverb(x: np.ndarray, wet: float) -> np.ndarray:
    x = stereo(x)
    y = np.stack([signal.oaconvolve(x[c], IR[c])[: x.shape[1]] for c in range(2)])
    return x + wet * y


def gate(n: int, t0: float, t1: float, fade_in: float, fade_out: float, base: float = 0.0) -> np.ndarray:
    """Hüllkurve, die einen Abschnitt im Gesamtpuffer ein- und ausblendet."""
    g = np.zeros(n)
    a, b = secs(t0 - base), secs(t1 - base)
    a, b = max(0, a), min(n, b)
    if b <= a:
        return g
    g[a:b] = 1
    fi = min(b - a, secs(fade_in))
    fo = min(b - a, secs(fade_out))
    if fi:
        g[a:a + fi] = np.linspace(0, 1, fi)
    if fo:
        g[b - fo:b] *= np.linspace(1, 0, fo)
    return g


# ---------------------------------------------------------------- Instrumente
def pad(notes, dur, fc=1200, attack=1.2, release=1.2, fc_end=None):
    n = secs(dur)
    L, R = np.zeros(n), np.zeros(n)
    for m in notes:
        f = mtof(m)
        for d in (-0.09, 0.0, 0.09):
            L += saw(f * 2 ** (d / 12), n, rng.random())
            R += saw(f * 2 ** ((d + 0.035) / 12), n, rng.random())
    x = np.stack([L, R]) / (3 * len(notes))
    x = lp_sweep(x, fc, fc_end or fc)
    return x * env_ar(n, attack, release)


def pluck(f, dur=0.8, ratio=2.0, index=2.5):
    n = secs(dur)
    t = np.arange(n) / SR
    I = index * np.exp(-t / 0.10)
    y = np.sin(2 * np.pi * f * t + I * np.sin(2 * np.pi * f * ratio * t))
    return y * np.exp(-t / 0.28) * (1 - np.exp(-t / 0.002))


def bell(f, dur=3.5):
    n = secs(dur)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t / 0.35)
    return y * np.exp(-t / 1.1) * (1 - np.exp(-t / 0.006))


def lead(m, dur):
    n = secs(dur)
    t = np.arange(n) / SR
    f = mtof(m) * (1 + 0.0018 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.25) / 0.4, 0, 1))
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) + 0.22 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    return y * env_ar(n, 0.12, min(0.6, dur * 0.4))


def kick(dur=0.55, f0=120, f1=46, tau=0.2, click=0.25):
    n = secs(dur)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.035)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / tau)
    if click:
        y += click * hp(noise(n), 2500) * np.exp(-t / 0.004)
    return y


def taiko(dur=1.2):
    n = secs(dur)
    t = np.arange(n) / SR
    f = 62 + 80 * np.exp(-t / 0.05)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.42)
    skin = bp(noise(n), 150, 900) * np.exp(-t / 0.05) * 0.6
    return body + skin


def hat(dur=0.08):
    n = secs(dur)
    return hp(noise(n), 7500) * dec(n, 0.025)


def shaker(dur=0.12):
    n = secs(dur)
    return bp(noise(n), 4500, 11000) * env_ar(n, 0.012, 0.09)


def blip(f, dur=0.075):
    n = secs(dur)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * env_ar(n, 0.004, 0.05)


def crash(dur=2.5):
    n = secs(dur)
    return np.stack([hp(noise(n), 3500), hp(noise(n), 3500)]) * dec(n, 0.55)


def boom(dur=3.0, f0=62, f1=28, tau=0.9):
    n = secs(dur)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / tau) * (1 - np.exp(-t / 0.003))


def sweep_noise(dur, f0, f1, shape="rise"):
    """Rauschen, dessen Band von f0 nach f1 wandert (Whoosh/Riser), per STFT-Maske."""
    n = secs(dur)
    W, H = 2048, 512
    x = noise(n + W)
    out = np.zeros(n + W)
    win = np.hanning(W)
    freqs = np.fft.rfftfreq(W, 1 / SR)
    lf = np.log2(np.maximum(freqs, 20))
    frames = range(0, n, H)
    for k in frames:
        p = k / max(1, n - 1)
        fc = f0 * (f1 / f0) ** p
        if shape == "rise":
            a = p ** 2.2
        else:                                           # whoosh: kurz an, lang aus
            a = min(1.0, p / 0.12) * (1 - p) ** 1.6
        mask = np.exp(-0.5 * ((lf - np.log2(fc)) / 0.55) ** 2) * a
        seg = np.fft.irfft(np.fft.rfft(x[k:k + W] * win) * mask) * win
        out[k:k + W] += seg
    out = out[:n]
    return np.stack([out, np.roll(out, 37)])


def rms(x):
    return float(np.sqrt(np.mean(np.square(x)))) + 1e-12


# ---------------------------------------------------------------- Laden
def load_mono(path: Path) -> np.ndarray:
    raw = subprocess.run([G.FF, "-v", "quiet", "-i", str(path), "-f", "f32le", "-ac", "1",
                          "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def write_mp3(x: np.ndarray, path: Path, kbps: int, extra_af: str | None = None) -> None:
    x = stereo(x)
    with tempfile.TemporaryDirectory() as td:
        raw = Path(td) / "x.f32"
        np.ascontiguousarray(x.T, dtype=np.float32).tofile(raw)
        args = ["-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", str(raw)]
        if extra_af:
            args += ["-af", extra_af]
        G.ff(*args, "-c:a", "libmp3lame", "-b:a", f"{kbps}k", str(path))


def lufs_of(x: np.ndarray) -> float:
    with tempfile.TemporaryDirectory() as td:
        raw = Path(td) / "x.f32"
        np.ascontiguousarray(stereo(x).T, dtype=np.float32).tofile(raw)
        p = G.ff("-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", str(raw), "-af",
                 "loudnorm=print_format=json", "-f", "null", "-")
    js = p.stderr[p.stderr.rfind("{"): p.stderr.rfind("}") + 1]
    return float(json.loads(js)["input_i"])


def mmss(t: float) -> str:
    return f"{int(t // 60)}:{t % 60:04.1f}"


# ---------------------------------------------------------------- Hauptteil
def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--neu", action="store_true")
    args = ap.parse_args()

    cfg = json.loads(G.SOUNDS.read_text(encoding="utf-8"))
    manifest = json.loads(G.MANIFEST.read_text(encoding="utf-8"))
    lines = {l["id"]: l for l in cfg["saetze"]}
    seqs = [l for l in cfg["saetze"] if l.get("teile")]
    if not seqs:
        print("Keine Sequenz in sounds.json – nichts zu tun.")
        return
    seq = seqs[0]
    sid = seq["id"]
    teile = seq["teile"]
    if len(teile) != 6:
        sys.exit(f"{sid}: Die Musik ist für genau 6 Abschnitte geschrieben (gefunden: {len(teile)}).")
    fehlt = [t for t in teile if t not in manifest or "teile" not in manifest[t]]
    if fehlt:
        sys.exit(f"{sid}: Zuerst generate.py laufen lassen – fehlt/ohne Zeitmarken: {', '.join(fehlt)}")

    vorlauf = float(seq.get("vorlauf", 3.2))
    pausen = [float(p) for p in seq.get("pausen", [2.4, 2.0, 2.4, 2.0, 2.6])]
    quelle = hashlib.sha1(json.dumps([MUSIK_VERSION, [manifest[t]["hash"] for t in teile],
                                      vorlauf, pausen]).encode()).hexdigest()[:10]
    mix_path = OUTDIR / MIX_NAME
    prev = manifest.get(sid, {})
    if not args.neu and prev.get("quelle") == quelle and mix_path.exists():
        print(f"{sid}: aktuell, nichts zu tun.")
        return

    print(f"→ {sid}: baue Sequenz mit Musik …")
    OUTDIR.mkdir(parents=True, exist_ok=True)

    # --- Stimme auf die Zeitachse legen
    audio = [load_mono(ROOT / manifest[t]["datei"]) for t in teile]
    rel = [manifest[t]["teile"] for t in teile]
    texts = [[p[0] for p in G.split_text(lines[t].get("sprechen") or lines[t]["text"])] for t in teile]
    starts, pos = [], None
    for i in range(6):
        if i == 0:
            s = vorlauf - rel[0][0][0]
        else:
            s = pos + pausen[i - 1] - rel[i][0][0]
        starts.append(s)
        pos = s + rel[i][-1][1]
    pieces = [[(starts[i] + a, starts[i] + b) for a, b in rel[i]] for i in range(6)]
    onset = [p[0][0] for p in pieces]
    speech_end = [p[-1][1] for p in pieces]

    # Stichwörter für die Regie
    cnt_idx = [k for k, tx in enumerate(texts[5]) if re.match(r"^(fünf|vier|drei|zwei|eins)\b", tx.strip(), re.I)]
    if len(texts[5]) != len(pieces[5]) or len(cnt_idx) < 3:
        cnt_idx = list(range(max(0, len(pieces[5]) - 6), len(pieces[5]) - 1))
    t_count = [pieces[5][k][0] for k in cnt_idx]
    t_bereit = pieces[5][cnt_idx[0] - 1][0] if cnt_idx[0] > 0 else onset[5]
    t_zeitsprung = pieces[5][-1]
    t_impact = t_zeitsprung[1] + 0.06
    t_euch = pieces[4][-1][0]

    total = t_impact + TAIL
    N = secs(total)
    voice = np.zeros(N)
    for i in range(6):
        a = secs(starts[i])
        voice[a:a + len(audio[i])] += audio[i][: max(0, N - a)]
    vref = rms(np.concatenate([voice[secs(a):secs(b)] for p in pieces for a, b in p]))

    mus = np.zeros((2, N))
    sfx = np.zeros((2, N))
    regie: list[tuple[float, str, str]] = []

    def ev(x, rel_db, measure=0.3, tail=False):
        x = stereo(x)
        m = secs(measure)
        seg = x[:, -m:] if tail else x[:, :m]
        return x * (vref * 10 ** (rel_db / 20) / rms(seg))

    def section(t0, t1, fade_in, fade_out, build, wet=0.3, level_db=0.0, ramp_db=None):
        """build(n) -> Stereo-Puffer ab t0; danach Hall, Ein-/Ausblenden, Pegel."""
        n = secs(t1 - t0) + secs(3.0)
        x = np.zeros((2, n))
        build(x, n)
        x = reverb(x, wet)
        g = gate(n, t0, t1, fade_in, fade_out, base=t0)
        if ramp_db:
            g *= 10 ** (np.linspace(ramp_db[0], ramp_db[1], n) / 20)
        add(mus, x * g * 10 ** (level_db / 20), t0)

    # --- A: Geheimnisvoller Beginn (leises Pulsieren, schwebende Fläche)
    tB0 = onset[1] - 1.6
    tA1 = tB0 + 1.2

    def build_a(x, n):
        add(x, pad([50, 57, 62, 64, 65], n / SR, fc=450, fc_end=900, attack=3.0, release=0.1), 0, 1.0)
        beat = 0.75
        k = 0
        while k * beat < n / SR:
            p = lp(saw(mtof(38), secs(0.7)) * dec(secs(0.7), 0.22), 240)
            add(x, p, k * beat, 0.55)
            k += 1
    section(0, tA1, 2.5, 1.2, build_a, wet=0.35, level_db=-4)
    regie.append((0, "Musik", "Leises, tiefes Pulsieren und schwebende Fläche (d-Moll), blendet ein"))

    # --- B: Staunen über die Technik (hell, weit, sanfter Rhythmus, Signaltöne)
    tB1 = onset[2] - 0.05                      # Einschnitt bei „Doch“
    bar = 2.4
    chords_b = [[50, 57, 62, 66, 69], [47, 54, 59, 62, 66], [43, 55, 59, 62, 67], [45, 52, 57, 61, 64]]

    def build_b(x, n):
        k = 0
        while k * bar < n / SR:
            ch = chords_b[k % 4]
            add(x, pad(ch, bar + 0.7, fc=1800, fc_end=2600, attack=1.4 if k == 0 else 0.3, release=0.7), k * bar, 0.9)
            top = [m + 12 for m in ch[1:]]
            pat = [0, 1, 2, 3, 2, 1, 2, 3]
            for j, idx in enumerate(pat):
                add(x, pluck(mtof(top[idx])), k * bar + j * 0.3, 0.16)
            if k >= 1:                         # Rhythmus ab dem 2. Takt
                for b in (0, 1.2):
                    add(x, kick(f0=100, tau=0.16, click=0.1), k * bar + b, 0.5)
                for j in range(8):
                    add(x, hat(), k * bar + j * 0.3, 0.05 if j % 2 else 0.03)
                for b in (0.6, 1.8):
                    add(x, shaker(), k * bar + b, 0.08)
            k += 1
    section(tB0, tB1, 1.0, 0.03, build_b, wet=0.28)
    regie.append((tB0, "Musik", "Musik öffnet sich: heller, weiter Klang (D-Dur), Arpeggio-Melodie"))
    regie.append((tB0 + bar, "Musik", "Sanfter Rhythmus setzt ein"))
    for a, b in zip(pieces[1][:-1], pieces[1][1:]):
        if b[0] - a[1] >= 0.3:
            t = a[1] + 0.1
            add(sfx, ev(np.concatenate([blip(1320), np.zeros(secs(0.03)), blip(1760)]), -15), t)
            regie.append((t, "Effekt", "Leiser technischer Signalton"))

    # --- C: Etwas ist schiefgelaufen (Rhythmus stoppt, tiefe Töne, Summen)
    regie.append((tB1, "Musik", "„Doch …“ – Einschnitt, Rhythmus und Musik stoppen"))
    tC0 = onset[2] + 0.5
    tC1 = onset[3] - 1.1

    def build_c(x, n):
        t = np.arange(n) / SR
        drone = (np.sin(2 * np.pi * mtof(38) * t) + 0.6 * np.sin(2 * np.pi * (mtof(45) + 0.25) * t)
                 + 0.25 * np.sin(2 * np.pi * mtof(50) * t))
        add(x, drone * 0.2, 0)
        am = 0.55 + 0.45 * np.sin(2 * np.pi * 0.37 * t) * np.sin(2 * np.pi * 0.11 * t + 1)
        hum = bp(noise(n), 110, 380) * am * 0.35 + 0.15 * np.sin(2 * np.pi * 98 * t + 0.4 * np.sin(2 * np.pi * 0.3 * t))
        add(x, hum, 0)
        notes = [62, 65, 57, 64, 60, 62]
        k = 0
        while 1.0 + k * 2.8 < n / SR - 3:
            add(x, bell(mtof(notes[k % len(notes)])), 1.0 + k * 2.8, 0.3)
            k += 1
    section(tC0, tC1, 2.0, 1.5, build_c, wet=0.45, level_db=-3)
    regie.append((tC0, "Musik", "Tiefe, reduzierte Töne und leises, unruhiges Summen (nachdenklich)"))
    t = onset[3] - 0.75
    add(sfx, ev(blip(990, 0.12), -22), t)
    regie.append((tC1, "Musik", "Kurze Stille"))
    regie.append((t, "Effekt", "Sehr leiser Signalton vor „Doch die Zukunft …“"))

    # --- D: Ein Hoffnungsschimmer (warmer, aufsteigender Akkord, Melodie, lauter werdend)
    tD0 = onset[3] - 0.05
    tE0 = onset[4] - 1.7
    tD1 = tE0 + 1.0
    chords_d = [([46, 53, 58, 62, 65], (74, 77)), ([48, 55, 60, 64, 67], (76, 79)), ([50, 57, 62, 66, 69], (78, 81))]

    def build_d(x, n):
        seg = (tD1 - tD0) / 3
        for k, (ch, mel) in enumerate(chords_d):
            add(x, pad(ch, seg + 1.0, fc=900 + 500 * k, fc_end=1400 + 500 * k,
                       attack=1.5 if k == 0 else 0.5, release=1.0), k * seg, 0.9)
            add(x, lead(mel[0], seg * 0.45), k * seg + 0.25, 0.12)
            add(x, lead(mel[1], seg * 0.55 + (0.6 if k == 2 else 0)), k * seg + seg * 0.5, 0.12)
    section(tD0, tD1, 1.5, 1.0, build_d, wet=0.4, ramp_db=(-4, 1))
    regie.append((tD0, "Musik", "Warmer, aufsteigender Akkord (B – C – D) und hoffnungsvolle Melodie, wird lauter"))

    # --- E: Die Kinder sind die Lösung (Trommeln, Musik wächst, Akzent bei „EUCH!“)
    tE1 = t_euch - 0.02

    def build_e(x, n):
        k = 0
        while k * bar < n / SR:
            ch = chords_b[k % 4]
            add(x, pad([m for m in ch] + [ch[0] + 24], bar + 0.7, fc=2200, fc_end=3200, attack=0.4, release=0.7), k * bar, 0.85)
            for b in (0, 1.2):
                add(x, taiko(), k * bar + b, 0.55)
            add(x, taiko(), k * bar + 2.1, 0.3)
            add(x, kick(f0=90, tau=0.25), k * bar, 0.45)
            for j in range(8):
                add(x, hat(), k * bar + j * 0.3, 0.04)
            k += 1
    section(tE0, tE1, 0.8, 0.02, build_e, wet=0.3, ramp_db=(-3, 2))
    regie.append((tE0, "Musik", "Rhythmus und dezente epische Trommeln setzen ein, Musik wächst"))
    for p in pieces[4][: min(3, len(pieces[4]) - 2)]:
        t = p[1] + 0.07
        add(sfx, ev(taiko(), -7), t)
        add(sfx, ev(taiko(), -11), t + 0.2)
        regie.append((t, "Effekt", "Trommelschlag in der Pause"))
    acc = np.zeros((2, secs(3.0)))
    add(acc, kick(dur=1.4, f0=110, f1=40, tau=0.5), 0, 1.0)
    add(acc, taiko(), 0, 0.8)
    add(acc, crash(), 0, 0.18)
    add(acc, pad([50, 57, 62, 66, 69, 74], 1.2, fc=3000, attack=0.005, release=1.0), 0, 0.6)
    add(sfx, ev(reverb(acc, 0.35), 1), t_euch)
    regie.append((t_euch, "Effekt", "„EUCH!“ – kräftiger Akzent, danach kurze Pause"))

    # --- F: Zeitmaschine und Countdown
    t_sig = onset[5] - 1.25
    sig = np.zeros((2, secs(0.6)))
    for j, f in enumerate((880, 1320, 1760)):
        add(sig, blip(f, 0.09), j * 0.14)
    add(sfx, ev(sig, -9), t_sig)
    regie.append((t_sig, "Effekt", "Elektronisches Startsignal"))
    tF0 = onset[5] - 0.9
    tF1 = t_impact

    def build_f(x, n):
        d = (tF1 - tF0)
        add(x, pad([38, 45, 50, 57], d + 0.1, fc=400, fc_end=1800, attack=1.0, release=0.05), 0, 0.7)
        step = 0.25
        k = 0
        pulse = np.zeros((2, secs(d + 0.3)))
        while k * step < d:
            m = 38 if k % 2 == 0 else 50
            p = saw(mtof(m), secs(0.2)) * env_ar(secs(0.2), 0.003, 0.12)
            add(pulse, p, k * step, 0.5)
            k += 1
        add(x, lp_sweep(pulse, 350, 4500) * np.linspace(0.5, 1.0, pulse.shape[1]), 0)
    t_c0 = t_count[0] - 0.1
    def lower(n):                                 # Musik während des Countdowns absenken
        g = np.ones(n)
        a, b = secs(t_c0 - tF0), secs(t_zeitsprung[0] - tF0)
        g[max(0, a):max(0, b)] = 10 ** (-5 / 20)
        return lp(g, 8)
    n_f = secs(tF1 - tF0) + secs(3.0)
    xf = np.zeros((2, n_f))
    build_f(xf, n_f)
    xf = reverb(xf, 0.25) * gate(n_f, tF0, tF1, 0.6, 0.01, base=tF0) * lower(n_f)
    add(mus, xf, tF0)
    regie.append((tF0, "Musik", "Ansteigender Puls"))

    riser = sweep_noise(max(0.5, t_count[0] + 0.15 - (t_bereit - 0.2)), 300, 7000, "rise")
    add(sfx, ev(riser, -8, tail=True), t_bereit - 0.2)
    regie.append((t_bereit - 0.2, "Effekt", "Heller Energie-Sweep"))
    regie.append((t_c0, "Musik", "Countdown – Musik etwas leiser"))
    for j, t in enumerate(t_count):
        imp = np.zeros((2, secs(0.6)))
        add(imp, kick(dur=0.4, f0=130, f1=55, tau=0.12), 0, 1.0)
        add(imp, blip(880 * 2 ** (j * 2 / 12), 0.09), 0, 0.4)
        add(sfx, ev(imp, -9), t)
    regie.append((t_count[0], "Effekt", f"Impuls auf jede Zahl ({len(t_count)}×)"))
    add(sfx, ev(sweep_noise(max(0.3, t_impact - t_zeitsprung[0]), 1500, 9000, "rise"), -12, tail=True), t_zeitsprung[0])

    imp = np.zeros((2, secs(TAIL)))
    add(imp, boom(), 0, 1.0)
    add(imp, crash(3.0), 0, 0.25)
    add(imp, sweep_noise(1.4, 6500, 180, "whoosh"), 0, 1.2)
    add(imp, pad([50, 57, 62, 66, 69, 74, 78], 3.0, fc=3200, fc_end=900, attack=0.005, release=2.6), 0, 0.5)
    add(sfx, ev(reverb(imp, 0.4), 2), t_impact)
    regie.append((t_impact, "Effekt", "„ZEITSPRUNG!“ – großer Whoosh/Impact, Musik stoppt und klingt aus"))

    # --- Ducking: Musik unter Sprache leiser
    ctrl = np.zeros(N)
    for p in pieces:
        for a, b in p:
            ctrl[max(0, secs(a - 0.15)):secs(b + 0.3)] = 1
    win = np.hanning(secs(0.25))
    ctrl = np.clip(signal.fftconvolve(ctrl, win / win.sum(), mode="same"), 0, 1)
    duck = 10 ** (-DUCK_DB * ctrl / 20)

    pause_mask = (ctrl < 0.01) & (np.abs(mus).sum(axis=0) > 1e-4)
    m_rms = rms(mus[:, pause_mask]) if pause_mask.any() else rms(mus)
    mus *= vref * 10 ** (-MUSIK_UNTER_STIMME / 20) / m_rms
    mus *= duck

    voice2 = stereo(voice)
    mix = voice2 + mus + sfx

    # --- Lautheit: auf -16 LUFS, Spitzen begrenzen
    g_db = G.LUFS - lufs_of(mix)
    g = 10 ** (g_db / 20)
    limit = 10 ** (G.TRUE_PEAK / 20)
    write_mp3(mix * g, mix_path, 192,
              f"alimiter=limit={limit:.4f}:level=0:attack=4:release=60")
    for name, x in (("Spur_Sprecher.mp3", voice2), ("Spur_Musik.mp3", mus), ("Spur_Effekte.mp3", sfx)):
        write_mp3(x * g, OUTDIR / name, 128)

    m2 = G.loudnorm_measure(mix_path)
    dauer = G.duration(mix_path)

    # --- Regie-Datei
    for i in range(6):
        regie.append((onset[i], "Sprecher", f"Abschnitt {i + 1}: „{texts[i][0]}“"))
    regie.sort(key=lambda r: r[0])
    md = ["# Eröffnung „Die Zukunft braucht euch“ – tatsächliche Zeitmarken", "",
          f"Gesamtdauer {mmss(dauer)} · erzeugt von `tools/intro.py` aus den Erzählerteilen in `sounds.json`.", "",
          "Spuren zum Weiterbearbeiten (z. B. Audacity): `Spur_Sprecher.mp3`, `Spur_Musik.mp3`, `Spur_Effekte.mp3` – "
          "gleiche Länge, zusammen ergeben sie die Mischung.", "",
          "| Zeit | Spur | Einsatz |", "|---|---|---|"]
    md += [f"| {mmss(t)} | {spur} | {txt} |" for t, spur, txt in regie]
    md += ["", "Bühnen-Cue: direkt nach dem Impact Leinwand-Blitz; die zwei Zeitreisenden erscheinen. "
           "SMARTy folgt erst auf ein separates Zeichen.", ""]
    (OUTDIR / "Regie.md").write_text("\n".join(md), encoding="utf-8")

    manifest = json.loads(G.MANIFEST.read_text(encoding="utf-8"))
    manifest[sid] = {"datei": f"audio/intro/{MIX_NAME}", "hash": G.file_hash(mix_path)[:10],
                     "quelle": quelle, "dauer": dauer, "lufs": round(float(m2["input_i"]), 1),
                     "tp": round(float(m2["input_tp"]), 1), "sequenz": True}
    G.MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"   {dauer:.1f} s · {manifest[sid]['lufs']} LUFS · TP {manifest[sid]['tp']} dBTP → {mix_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
