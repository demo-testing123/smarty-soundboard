"""Baut den Stadt-Konfigurator als EINE HTML-Datei (offline per Doppelklick, ohne Server).

Aufruf (im Ordner stadt/):   python einzeldatei.py
Ergebnis:                    START-IT-SMART_Stadtkonfigurator.html

Technik: Alle JavaScript-Module stehen als data:-Adressen in einer Import-Map; ihre Importe werden auf feste Namen
umgeschrieben. Schriften stecken als data:-Adressen im CSS. Die Datei braucht kein Internet. Nur die Knöpfe zu den
eigenständigen Simulationen (Natur, Verkehr, Wohnen) zeigen auf deren Online-Fassung, weil diese eigene Programme sind.
"""
import base64, json, os, re, sys

HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.dirname(HIER)
ONLINE = 'https://demo-testing123.github.io/smarty-soundboard/'

MODULE = {   # fester Name → Datei
    'sis/three': 'lib/three.module.min.js',
    'sis/welt': 'minecraft/welt.js',
    'sis/mcworld': 'minecraft/mcworld.js',
    'sis/stadtmodell': 'stadt/stadtmodell.js',
    'sis/daten': 'stadt/daten.js',
    'sis/zustand': 'stadt/zustand.js',
    'sis/ansicht3d': 'stadt/ansicht3d.js',
    'sis/minecraft-ausgabe': 'stadt/minecraft-ausgabe.js',
    'sis/weltleser': 'stadt/weltleser.js',
    'sis/main': 'stadt/main.js',
}
NACH_DATEI = {v: k for k, v in MODULE.items()}


def lies(rel):
    return open(os.path.join(WURZEL, rel), encoding='utf-8').read()


def umschreiben(rel, quelle):
    basis = os.path.dirname(rel)

    def ersetze(m):
        ziel = os.path.normpath(os.path.join(basis, m.group(2))).replace('\\', '/')
        if ziel not in NACH_DATEI:
            raise SystemExit(f'unbekannter Import {m.group(2)} in {rel}')
        return f"{m.group(1)}'{NACH_DATEI[ziel]}'"
    quelle = re.sub(r"""(\bfrom\s*|\bimport\s*)['"](\.{1,2}/[^'"]+)['"]""", ersetze, quelle)
    if rel == 'stadt/main.js':    # Ersatzwelt liegt nicht neben der Einzeldatei: Online-Fassung
        assert 'href: ERSATZWELT,' in quelle
        quelle = quelle.replace('href: ERSATZWELT,', f"href: '{ONLINE}stadt/' + ERSATZWELT,")
    if rel == 'stadt/daten.js':   # Links zu den eigenständigen Simulationen: Online-Fassung
        quelle = re.sub(r"href: '\.\./(natur|verkehr|wohnen)/'", lambda m: f"href: '{ONLINE}{m.group(1)}/'", quelle)
    return quelle


def data_url(typ, inhalt):
    if isinstance(inhalt, str):
        inhalt = inhalt.encode('utf-8')
    return f'data:{typ};base64,' + base64.b64encode(inhalt).decode('ascii')


def main():
    importmap = {'imports': {name: data_url('text/javascript', umschreiben(rel, lies(rel))) for name, rel in MODULE.items()}}
    css = lies('stadt/style.css')
    for datei in ('dm-sans.woff2', 'ibm-plex-mono-500.woff2'):
        roh = open(os.path.join(HIER, 'schrift', datei), 'rb').read()
        css = css.replace(f'url(schrift/{datei})', f'url({data_url("font/woff2", roh)})')
    html = lies('stadt/index.html')
    html = html.replace('<link rel="stylesheet" href="style.css">', f'<style>\n{css}\n</style>')
    html = html.replace('<script type="module" src="main.js"></script>',
                        '<script type="importmap">' + json.dumps(importmap) + '</script>\n<script type="module">import \'sis/main\';</script>')
    html = re.sub(r"<script>\s*// Offline: gemeinsamer Service Worker.*?</script>", '', html, flags=re.S)
    html = html.replace('<title>Stadt-Konfigurator · START IT SMART</title>',
                        '<title>Stadt-Konfigurator · START IT SMART</title>\n<!-- Einzeldatei, erzeugt mit stadt/einzeldatei.py aus dem Projekt smarty-soundboard. Lizenzen: three.js (MIT), DM Sans und IBM Plex Mono (SIL OFL 1.1). -->')
    assert 'src="main.js"' not in html and 'href="style.css"' not in html
    ziel = os.path.join(HIER, 'START-IT-SMART_Stadtkonfigurator.html')
    open(ziel, 'w', encoding='utf-8').write(html)
    print(f'{ziel}: {os.path.getsize(ziel) / 1024 / 1024:.2f} MB')


if __name__ == '__main__':
    main()
