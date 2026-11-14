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


def tts_settings(voice: dict, line: dict) -> dict:
    s = {"voice": "de-DE-ChristophNeural", "rate": "+0%", "pitch": "+0Hz", "volume": "+0%"}
    s.update(voice.get("tts", {}))
    s.update(line.get("tts", {}))
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


def build(line: dict, voice: dict, out: Path) -> dict:
    s = tts_settings(voice, line)
    pieces = split_text(line.get("sprechen") or line["text"])
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        inputs, chain, labels = [], [], []
        for i, (txt, pause) in enumerate(pieces):
            mp3 = td / f"p{i}.mp3"
            asyncio.run(speak(txt, s, mp3))
            inputs += ["-i", str(mp3)]
            chain.append(f"[{i}:a]aresample=44100,aformat=channel_layouts=mono,{TRIM}[t{i}]")
            labels.append(f"[t{i}]")
            if pause > 0:
                chain.append(f"anullsrc=r=44100:cl=mono,atrim=duration={pause}[s{i}]")
                labels.append(f"[s{i}]")
        chain.append(f"{''.join(labels)}concat=n={len(labels)}:v=0:a=1,"
                     "adelay=40,apad=pad_dur=0.25[out]")
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
            "dauer": duration(out)}


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

        if line.get("datei"):                      # eigene Aufnahme
            f = ROOT / line["datei"]
            if not f.exists():
                fehler.append(f"{lid}: Datei {line['datei']} nicht gefunden")
                continue
            new[lid] = {"datei": line["datei"], "hash": file_hash(f)[:10],
                        "dauer": duration(f), "eigen": True}
            continue

        s = tts_settings(voice, line)
        key = json.dumps([VERSION, line.get("sprechen") or line["text"], s], ensure_ascii=False)
        h = hashlib.sha1(key.encode("utf-8")).hexdigest()[:10]
        out = AUDIO / f"{lid}.mp3"
        prev = old.get(lid, {})
        aktuell = prev.get("hash") == h and out.exists() and not prev.get("eigen")
        if aktuell and not args.alle and lid not in args.nur:
            new[lid] = prev
            continue
        if args.nur and lid not in args.nur and out.exists() and prev:
            new[lid] = prev
            continue

        print(f"→ {lid}  ({s['voice']}, {s['pitch']}, {s['rate']})")
        try:
            info = build(line, voice, out)
        except Exception as e:
            fehler.append(f"{lid}: {e}")
            if prev:
                new[lid] = prev
            continue
        new[lid] = {"datei": f"audio/{lid}.mp3", "hash": h, **info}
        print(f"   {info['dauer']:.1f} s · {info['lufs']} LUFS · TP {info['tp']} dBTP")

    # verwaiste MP3s entfernen (nur selbst erzeugte, keine eigenen Aufnahmen)
    behalten = {(ROOT / v["datei"]).resolve() for v in new.values()}
    for f in AUDIO.glob("*.mp3"):
        if f.resolve() not in behalten and f.stem not in ids:
            print(f"✗ entferne {f.name} (nicht mehr in sounds.json)")
            f.unlink()

    MANIFEST.write_text(json.dumps(new, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"Fertig: {len(new)} Sounds in audio/manifest.json")
    if fehler:
        print("\nFEHLER:\n  " + "\n  ".join(fehler))
        sys.exit(1)


if __name__ == "__main__":
    main()
