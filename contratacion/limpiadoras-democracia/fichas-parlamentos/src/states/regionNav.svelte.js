import { data } from './data.svelte.js';
import { vizLang } from './language.svelte.js';
import { urlInfo } from './utils.svelte.js';

// geojs.io English region → parliament id (ids come from the ISO code via
// `idByIso` in data.svelte.js). National chambers have no region, so they are
// never detected by IP.
const ipRegionToId = {
  Andalusia: 'andalucia',
  Aragon: 'aragon',
  'Principality of Asturias': 'asturias',
  'Balearic Islands': 'baleares',
  'Canary Islands': 'canarias',
  Cantabria: 'cantabria',
  'Castille-La Mancha': 'castillalamancha',
  'Castille and León': 'castillayleon',
  Catalonia: 'cataluna',
  Extremadura: 'extremadura',
  Galicia: 'galicia',
  'La Rioja': 'larioja',
  Madrid: 'madrid',
  Murcia: 'murcia',
  Navarre: 'navarra',
  'Basque Country': 'paisvasco',
  Valencia: 'comunitatvalenciana',
};

/**
 * Reactive navigation state for the parliament cards section.
 * Holds the alphabetically sorted list, the active id and prev/next/select
 * helpers so the selector, nav buttons and swipe all drive the same state.
 */
class RegionNav {
  // Regions only, alphabetical. The national chambers (Congreso, Senado) live
  // separately, in the article body.
  // Derived: empty until the CSV loads, and re-sorted if the language changes.
  sections = $derived(
    data.parliaments
      .filter((p) => p.type !== 'chamber')
      .sort((a, b) => a.name.localeCompare(b.name, vizLang.value, { sensitivity: 'base' }))
  );

  // Set by detectAndSelect() once the data has loaded.
  selectedId = $state(null);

  selected = $derived(this.sections.find((s) => s.id === this.selectedId));
  index = $derived(this.sections.findIndex((s) => s.id === this.selectedId));

  has(id) {
    return this.sections.some((s) => s.id === id);
  }

  pickRandom() {
    const i = Math.floor(Math.random() * this.sections.length);
    this.selectedId = this.sections[i].id;
  }

  /**
   * Picks the initial card: ?region=<id> pins it; otherwise IP geolocation
   * (Spain → its region); on any failure, a random one.
   */
  async detectAndSelect() {
    if (this.sections.length === 0) return;

    // Pin via ?region=<id>
    const requested = urlInfo.url.searchParams.get('region');
    if (requested && this.has(requested)) {
      this.selectedId = requested;
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    try {
      const ipInfo = await fetch('https://get.geojs.io/v1/ip/geo.json', {
        signal: controller.signal,
      }).then((r) => r.json());

      // The selector is usable while we wait: if the reader already picked a
      // region, keep it instead of overriding it with the detected one.
      if (this.selectedId != null) return;

      if (ipInfo?.country_code === 'ES') {
        const id = ipRegionToId[ipInfo.region];
        if (id && this.has(id)) {
          this.selectedId = id;
          return;
        }
      }
    } catch {
      // Silently fall back to a random one
    } finally {
      clearTimeout(timeoutId);
    }

    // Same on failure/timeout: only fall back to random if nothing is picked yet.
    if (this.selectedId == null) this.pickRandom();
  }

  select(id) {
    this.selectedId = id;
  }

  prev() {
    const i = this.index;
    const n = this.sections.length;
    this.selectedId = this.sections[(i - 1 + n) % n].id;
  }

  next() {
    const i = this.index;
    const n = this.sections.length;
    this.selectedId = this.sections[(i + 1) % n].id;
  }
}

export const regionNav = new RegionNav();
