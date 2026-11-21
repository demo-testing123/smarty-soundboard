/* Gemeinsame Strich-Symbole der beiden Dashboards (eigene Zeichnungen, 24 × 24).
 * Verwendung: <svg class="ico"><use href="#i-film"/></svg> */
(() => {
  const S = {
    rakete: '<path d="M12 3c3 2 5 6 4 10l-2 3h-4l-2-3c-1-4 1-8 4-10z"/><circle cx="12" cy="9" r="1.7"/><path d="M8 13l-3 3 3 1M16 13l3 3-3 1M10.5 19l1.5 2 1.5-2"/>',
    blatt: '<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19c3-4 6-7 10-9"/>',
    zahnrad: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    auto: '<path d="M4 16v-4l2-5h12l2 5v4z"/><path d="M4 12h16"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>',
    haus: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    hut: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/><path d="M22 9v6"/>',
    flagge: '<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
    hund: '<path d="M7 7 4 4.5 4.5 11M17 7l3-2.5-.5 6.5"/><rect x="6" y="6.5" width="12" height="12.5" rx="5"/><circle cx="9.6" cy="12" r=".9" fill="currentColor"/><circle cx="14.4" cy="12" r=".9" fill="currentColor"/><path d="M10.6 15.6h2.8"/>',
    chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx=".5"/><path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/>',
    play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
    stopp: '<rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none"/>',
    laut: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    pfeil: '<path d="M6 9l6 6 6-6"/>',
    film: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M3 8l2-4h14l2 4M9 4 8 8M14 4l-1 4M19 4l-1 4"/><path d="M10.5 11.5v5l4-2.5z" fill="currentColor"/>',
    wuerfel: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
    bloecke: '<path d="M3 8h6v6H3zM9 8h6v6H9zM15 8h6v6h-6zM6 14h6v6H6zM12 14h6v6h-6zM9 2h6v6H9z"/>',
    calliope: '<path d="M12 2.5l2.8 5.6 6.2.9-4.5 4.4 1 6.1-5.5-2.9-5.5 2.9 1-6.1L3 9l6.2-.9z"/><circle cx="9.7" cy="11.3" r=".9" fill="currentColor"/><circle cx="14.3" cy="11.3" r=".9" fill="currentColor"/>',
    praesentation: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M12 16v4M8 21l4-1 4 1"/><path d="M7 12.5l3-3 2 2 4.5-4.5"/>',
    extern: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M20 14v2"/>',
    zurueck: '<path d="M15 6l-6 6 6 6"/>',
    weiter: '<path d="M9 6l6 6-6 6"/>',
  };
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">' +
    Object.entries(S).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('') + '</svg>';
  document.body.insertAdjacentHTML('afterbegin', svg);
})();
