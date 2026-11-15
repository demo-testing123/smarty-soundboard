"""Erzeugt aus sounds.json die Sprachdateien unter audio/.

Aufruf (im Projektordner):
    pip install -r tools/requirements.txt
    python tools/generate.py            # nur neue oder geänderte Sätze
    python tools/generate.py --alle     # alles neu erzeugen
    python tools/generate.py --nur SMARTy_01_Landung

Ablauf je Satz: Text an den Pausenmarken [Pause 0.5] aufteilen, jeden Teil mit
edge-tts sprechen lassen, Stille an den Rändern abschneiden, mit den Pausen
zusammensetzen und auf -16 LUFS / -1.5 dBTP angleichen. Ergebnis: audio/<id>.mp3.

Sätze mit "datei" (eigene Aufnahme) werden nicht erzeugt, nur in die
Manifest-Datei eingetragen, damit die Seite die aktuelle Version lädt.

Optional je Stimme oder Satz: "klang": {"formant", "tiefe", "waerme", "alter", "praesenz", "rau"}
(Bedeutung siehe klang_filter bzw. README).
Sätze mit "teile" (Sequenzen mit Musik) baut tools/intro.py.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOUNDS = ROOT / "sounds.json"
AUDIO = ROOT / "audio"
MANIFEST = AUDIO / "manifest.json"

VERSION = "3"            # erhöhen, wenn sich die Verarbeitung ändert -> alles neu
LUFS, TRUE_PEAK = -16.0, -1.5
PAUSE_RE = re.compile(r"\[\s*pause\s*([0-9]+(?:[.,][0-9]+)?)\s*s?\s*\]", re.I)


def ffmpeg_exe() -> str:
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("ffmpeg fehlt: 'pip install imageio-ffmpeg' oder ffmpeg installieren.")


FF = ffmpeg_exe()


def ff(*args: str) -> subprocess.CompletedProcess:
    p = subprocess.run([FF, "-hide_banner", "-nostdin", "-y", *args],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    if p.returncode:
        raise RuntimeError(p.stderr[-2000:])
    return p


def split_text(text: str) -> list[tuple[str, float]]:
    """'A [Pause 0.5] B' -> [('A', 0.5), ('B', 0)]"""
    parts, pos = [], 0
    for m in PAUSE_RE.finditer(text):
        parts.append([text[pos:m.start()].strip(), float(m.group(1).replace(",", "."))])
        pos = m.end()
    parts.append([text[pos:].strip(), 0.0])
    out: list[tuple[str, float]] = []
    for t, p in parts:
        if t:
            out.append((t, p))
        elif out:                       # Pause ohne Text davor -> an vorigen Teil hängen
            out[-1] = (out[-1][0], out[-1][1] + p)
    return out


def variants(voice: dict) -> list[tuple[str | None, dict]]:
    """Stimmvarianten einer Stimme: [(id, variante), …] oder [(None, {})] ohne Varianten."""
    vs = voice.get("varianten") or []
    return [(v["id"], v) for v in vs] or [(None, {})]


def standard_variant(voice: dict) -> str | None:
    vs = voice.get("varianten") or []
    for v in vs:
        if v.get("standard"):
            return v["id"]
    return vs[0]["id"] if vs else None


def vkey(lid: str, vid: str | None) -> str:
    """Manifest-Schlüssel und Dateiname eines Satzes in einer Stimmvariante."""
    return f"{lid}__{vid}" if vid else lid


def tts_settings(voice: dict, line: dict, variant: dict | None = None) -> dict:
    s = {"voice": "de-DE-ChristophNeural", "rate": "+0%", "pitch": "+0Hz", "volume": "+0%"}
    s.update(voice.get("tts", {}))
    s.update((variant or {}).get("tts", {}))
    s.update(line.get("tts", {}))
    if line.get("tempo"):                   # relativ zur Stimme, z. B. -4 = 4 Prozentpunkte langsamer
        r = int(round(float(s["rate"].rstrip("%")) + float(line["tempo"])))
        s["rate"] = f"{r:+d}%"
    return s


async def speak(text: str, s: dict, path: Path) -> None:
    import edge_tts
    for versuch in range(4):
        try:
            com = edge_tts.Communicate(text, s["voice"], rate=s["rate"],
                                       pitch=s["pitch"], volume=s["volume"])
            await com.save(str(path))
            if path.stat().st_size > 0:
                return
        except Exception as e:          # Netzfehler o. Ä.: kurz warten, neu versuchen
            if versuch == 3:
                raise
            print(f"   … neuer Versuch ({e.__class__.__name__})")
        await asyncio.sleep(2 + versuch * 2)


TRIM = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,"
        "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,areverse")


def loudnorm_measure(src: Path) -> dict:
    p = ff("-i", str(src), "-af",
           f"loudnorm=I={LUFS}:TP={TRUE_PEAK}:LRA=11:print_format=json", "-f", "null", "-")
    js = p.stderr[p.stderr.rfind("{"): p.stderr.rfind("}") + 1]
    return json.loads(js)


def klang_settings(voice: dict, line: dict, variant: dict | None = None) -> dict:
    k = dict(voice.get("klang", {}))
    if variant and "klang" in variant:
        k = dict(variant["klang"])
    k.update(line.get("klang", {}))
    return k


def klang_filter(k: dict, src: str, dst: str) -> str:
    """Stimmfarbe (Länge bleibt gleich):
    formant  Halbtöne, z. B. -1.5 = größerer Stimmkörper (stark negativ wirkt bedrohlich)
    tiefe    dB Brustton (Bass)
    waerme   dB untere Mitten (um 220 Hz) + weichere Höhen = warm, freundlich
    alter    0…1 leichtes Zittern in Tonhöhe und Lautstärke = ältere Stimme
    praesenz dB bei 3 kHz für Verständlichkeit (Standard 2)
    rau      0…1 Anteil gesättigter Mitten = rauchig, kratzig"""
    keys = ("formant", "tiefe", "rau", "waerme", "alter")
    if not any(float(k.get(x, 0)) for x in keys) and "praesenz" not in k:
        return f"{src}anull{dst}"
    st = float(k.get("formant", 0))
    tiefe = float(k.get("tiefe", 0))
    rau = float(k.get("rau", 0))
    waerme = float(k.get("waerme", 0))
    alter = float(k.get("alter", 0))
    praesenz = float(k.get("praesenz", 2))
    f = []
    if st:
        r = 2 ** (st / 12)
        f.append(f"asetrate={44100 * r:.2f},aresample=44100,atempo={1 / r:.5f}")
    f.append("highpass=f=60")
    if tiefe:
        f.append(f"lowshelf=f=130:g={tiefe},equalizer=f=330:t=q:w=1.2:g={-0.8 * tiefe:.1f}")
    if waerme:
        f.append(f"equalizer=f=220:t=q:w=0.9:g={waerme:.1f},highshelf=f=7000:g={-0.7 * waerme:.1f}")
    if praesenz:
        f.append(f"equalizer=f=3000:t=q:w=1:g={praesenz:.1f}")
    if alter:
        f.append(f"vibrato=f=5.6:d={0.10 * alter:.3f},tremolo=f=6.3:d={0.05 * alter:.3f}")
    head = f"{src}{','.join(f)}"
    if waerme:                                   # warm: sanft komprimieren
        comp = "acompressor=threshold=-20dB:ratio=1.8:attack=15:release=250:makeup=1.3"
    elif rau > 0:
        comp = "acompressor=threshold=-22dB:ratio=3:attack=8:release=150:makeup=2,deesser"
    else:
        comp = "acompressor=threshold=-22dB:ratio=2.5:attack=8:release=150:makeup=1.5"
    if rau > 0:
        return (f"{head},asplit[kd][kw];[kw]highpass=f=900,lowpass=f=4500,volume=14dB,"
                f"asoftclip=type=tanh,volume=-14dB[kg];[kd][kg]amix=inputs=2:weights='1 {rau}':normalize=0,"
                f"{comp}{dst}")
    return f"{head},{comp}{dst}"


def wav_seconds(path: Path) -> float:
    with wave.open(str(path), "rb") as w:
        return w.getnframes() / w.getframerate()


def build(line: dict, s: dict, k: dict, out: Path) -> dict:
    pieces = split_text(line.get("sprechen") or line["text"])
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        inputs, chain, labels, teile = [], [], [], []
        pos = 0.04                                   # adelay 40 ms
        for i, (txt, pause) in enumerate(pieces):
            mp3, wav = td / f"p{i}.mp3", td / f"p{i}.wav"
            asyncio.run(speak(txt, s, mp3))
            ff("-i", str(mp3), "-af", f"aresample=44100,aformat=channel_layouts=mono,{TRIM}",
               "-c:a", "pcm_s16le", str(wav))
            d = wav_seconds(wav)
            teile.append([round(pos, 3), round(pos + d, 3)])
            pos += d + pause
            inputs += ["-i", str(wav)]
            labels.append(f"[{i}:a]")
            if pause > 0:
                chain.append(f"anullsrc=r=44100:cl=mono,atrim=duration={pause}[s{i}]")
                labels.append(f"[s{i}]")
        chain.append(f"{''.join(labels)}concat=n={len(labels)}:v=0:a=1,"
                     "adelay=40,apad=pad_dur=0.25[c]")
        chain.append(klang_filter(k, "[c]", "[out]"))
        raw = td / "raw.wav"
        ff(*inputs, "-filter_complex", ";".join(chain), "-map", "[out]", str(raw))

        m = loudnorm_measure(raw)
        ff("-i", str(raw), "-af",
           f"loudnorm=I={LUFS}:TP={TRUE_PEAK}:LRA=11:linear=true"
           f":measured_I={m['input_i']}:measured_TP={m['input_tp']}"
           f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
           f":offset={m['target_offset']},aresample=44100",
           "-ac", "1", "-c:a", "libmp3lame", "-b:a", "128k", str(out))
    m2 = loudnorm_measure(out)
    return {"lufs": round(float(m2["input_i"]), 1), "tp": round(float(m2["input_tp"]), 1),
            "dauer": duration(out), "teile": teile}


def duration(path: Path) -> float:
    p = subprocess.run([FF, "-hide_banner", "-i", str(path)], capture_output=True,
                       text=True, encoding="utf-8", errors="replace")
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", p.stderr)
    return round(int(m[1]) * 3600 + int(m[2]) * 60 + float(m[3]), 2) if m else 0.0


def file_hash(path: Path) -> str:
    return hashlib.sha1(path.read_bytes()).hexdigest()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--alle", action="store_true", help="alles neu erzeugen")
    ap.add_argument("--nur", nargs="*", default=[], help="nur diese IDs")
    args = ap.parse_args()

    cfg = json.loads(SOUNDS.read_text(encoding="utf-8"))
    voices = {v["id"]: v for v in cfg["stimmen"]}
    AUDIO.mkdir(exist_ok=True)
    old = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    new: dict[str, dict] = {}
    fehler = []

    ids = [l["id"] for l in cfg["saetze"]]
    doppelt = {i for i in ids if ids.count(i) > 1}
    if doppelt:
        sys.exit(f"Doppelte IDs in sounds.json: {', '.join(sorted(doppelt))}")

    for line in cfg["saetze"]:
        lid = line["id"]
        voice = voices.get(line["stimme"])
        if voice is None:
            fehler.append(f"{lid}: Stimme '{line['stimme']}' fehlt unter 'stimmen'")
            continue

        if line.get("teile") or line.get("aufnahme"):   # Sequenz mit Musik -> tools/intro.py
            for vid, _ in variants(voice):
                if vkey(lid, vid) in old:
                    new[vkey(lid, vid)] = old[vkey(lid, vid)]
            continue

        if line.get("datei"):                      # eigene Aufnahme
            f = ROOT / line["datei"]
            if not f.exists():
                fehler.append(f"{lid}: Datei {line['datei']} nicht gefunden")
                continue
            new[lid] = {"datei": line["datei"], "hash": file_hash(f)[:10],
                        "dauer": duration(f), "eigen": True}
            continue

        vlist = [(None, {})] if line.get("gruppe") == "proben" else variants(voice)
        for vid, var in vlist:
            key_id = vkey(lid, vid)
            s = tts_settings(voice, line, var)
            k = klang_settings(voice, line, var)
            key = json.dumps([VERSION, line.get("sprechen") or line["text"], s] + ([k] if k else []),
                             ensure_ascii=False)
            h = hashlib.sha1(key.encode("utf-8")).hexdigest()[:10]
            out = AUDIO / f"{key_id}.mp3"
            prev = old.get(key_id, {})
            aktuell = prev.get("hash") == h and out.exists() and not prev.get("eigen")
            if aktuell and not args.alle and lid not in args.nur:
                new[key_id] = prev
                continue
            if args.nur and lid not in args.nur and out.exists() and prev:
                new[key_id] = prev
                continue

            print(f"→ {key_id}  ({s['voice']}, {s['pitch']}, {s['rate']}{', klang ' + json.dumps(k) if k else ''})")
            try:
                info = build(line, s, k, out)
            except Exception as e:
                fehler.append(f"{key_id}: {e}")
                if prev:
                    new[key_id] = prev
                continue
            new[key_id] = {"datei": f"audio/{key_id}.mp3", "hash": h, **info}
            print(f"   {info['dauer']:.1f} s · {info['lufs']} LUFS · TP {info['tp']} dBTP")

    # verwaiste MP3s entfernen (nur selbst erzeugte, keine eigenen Aufnahmen)
    behalten = {(ROOT / v["datei"]).resolve() for v in new.values()}
    for f in AUDIO.glob("*.mp3"):
        if f.resolve() not in behalten:
            print(f"✗ entferne {f.name} (nicht mehr in sounds.json)")
            f.unlink()

    MANIFEST.write_text(json.dumps(new, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"Fertig: {len(new)} Sounds in audio/manifest.json")
    if fehler:
        print("\nFEHLER:\n  " + "\n  ".join(fehler))
        sys.exit(1)


if __name__ == "__main__":
    main()
