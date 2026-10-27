// Treated chamber photos (Civio style), one per parliament. The file is named
// by code: regions by their lowercase ISO (ES-AR → ar.jpg), national chambers
// by their id (congreso.jpg, senado.jpg). Extension-agnostic, so a photo can be
// swapped for another format without touching code.
const modules = import.meta.glob('../assets/parliament-photos/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

// file code (without extension) → URL
const byCode = {};
for (const [path, url] of Object.entries(modules)) {
  const code = path
    .split('/')
    .pop()
    .replace(/\.\w+$/, '');
  byCode[code] = url;
}

// parliament → file code: regions derive it from the ISO; chambers from the id.
const codeOf = (p) => (p.iso ? p.iso.replace('ES-', '').toLowerCase() : p.id);

/**
 * URL of a parliament's chamber photo, or undefined if there is none yet.
 * @param {{ id: string, iso: string | null }} p
 * @returns {string | undefined}
 */
export const photoOf = (p) => byCode[codeOf(p)];

/**
 * Warm the browser cache for every chamber photo so navigating between cards is
 * instant instead of triggering a per-card network fetch. The photos are light
 * (~240 KB each) and all get viewed as the user browses, so preloading the whole
 * set up front is cheap and removes the visible load lag on each transition.
 */
export function preloadPhotos() {
  for (const url of Object.values(byCode)) {
    const img = new Image();
    img.src = url;
  }
}
