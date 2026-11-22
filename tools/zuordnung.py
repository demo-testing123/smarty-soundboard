"""Schreibt SMARTy_Zuordnung.md aus sounds.json ("missionen") und audio/manifest.json.

    python tools/zuordnung.py

Eine Zeile je Clip, in der Reihenfolge des Regie-Soundboards: Kennung, Taste, Sprecher, Szene, Text, Datei mit Dauer,
Einsatz/Stand. Reserveclips stehen je Mission darunter.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TASTE = {"'": "Umschalt + #", "&": "Umschalt + 6", "*": "Umschalt + +", "?": "Umschalt + ß", "_": "Umschalt + -"}
SPRECHER = {"smarty": "SMARTy", "ki": "Zeitmaschinen-KI"}


def zelle(s: str) -> str:
    return str(s).replace("|", "\\|").replace("\n", " ")


def main() -> None:
    cfg = json.loads((ROOT / "sounds.json").read_text(encoding="utf-8"))
    man = json.loads((ROOT / "audio" / "manifest.json").read_text(encoding="utf-8"))
    saetze = {s["id"]: s for s in cfg["saetze"]}
    md = ["# Clip-Zuordnung: Mission → Szene → Clip → Datei", "",
          "Automatisch erzeugt aus `sounds.json` (`\"missionen\"`) mit `python tools/zuordnung.py`. Reihenfolge = Regie-Soundboard "
          "(Drehbuch vom 22.11.2026, Änderungsauftrag vom 22.11.2026). SMARTy: Sprachausgabe Christoph (+20 Hz, +3 %), "
          "Zeitmaschinen-KI: Tanja (digital). Alle Clips ohne Musik, auf −16 LUFS angeglichen.", "",
          "**Prüfung Text ↔ Audio:** Die Sprachdateien werden aus dem Feld `sprechen` erzeugt. Es entspricht dem angezeigten Text, "
          "nur mit Pausenmarken und Aussprache (z. B. „zweitausendfünfzig“). Der Generator erzeugt jede Datei neu, sobald sich dieser Text "
          "ändert. `test-dashboards.html` vergleicht zusätzlich die Satzteile in der Audiodatei. Das ist keine Spracherkennung: "
          "Vor der Show einmal anhören.", ""]
    for m in cfg["missionen"]:
        md += [f"## {m['name']} – {m['titel']}", "", "| Kennung | Taste | Sprecher | Szene | Text | Datei | Einsatz / Stand |", "|---|---|---|---|---|---|---|"]
        reserve = []
        for x in m["clips"]:
            if "hinweis" in x:
                md.append(f"| – | | | *{zelle(x['hinweis'])}* | | | |")
                continue
            s, f = saetze[x["id"]], man.get(x["id"], {})
            t = s.get("taste", "")
            zeile = (f"| **{x['nr']}** | {('`' + TASTE.get(t, t.upper()) + '`') if t else '–'} | {SPRECHER.get(s['stimme'], s['stimme'])} | "
                     f"{zelle(x.get('szene', ''))} | {zelle(s.get('text', ''))} | `{f.get('datei', 'fehlt')}`"
                     f"{' (' + format(f['dauer'], '.1f').replace('.', ',') + ' s)' if f.get('dauer') else ''} | {zelle(s.get('einsatz', ''))} |")
            (reserve if x.get("reserve") else md).append(zeile)
        if reserve:
            md += ["", "Reserve (nicht im aktuellen Drehbuch, bleibt erhalten):", "", "| Kennung | Taste | Sprecher | Szene | Text | Datei | Einsatz / Stand |", "|---|---|---|---|---|---|---|"] + reserve
        md.append("")
    (ROOT / "SMARTy_Zuordnung.md").write_text("\n".join(md), encoding="utf-8", newline="\n")
    n = sum(1 for m in cfg["missionen"] for x in m["clips"] if "id" in x)
    print(f"SMARTy_Zuordnung.md: {n} Clips in {len(cfg['missionen'])} Missionen")


if __name__ == "__main__":
    main()
