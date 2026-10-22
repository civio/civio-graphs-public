/**
 * @store ReaderCountry
 *
 * The reader's country, guessed from their IP, so the chart can highlight it: the piece is
 * translated and embedded abroad, so "your country" is not always Spain. Any failure
 * (network, rate limit, blocker, timeout) leaves `iso` as null and nothing gets highlighted.
 */

const IP_API_URL = 'https://free.freeipapi.com/api/v1/json';
const TIMEOUT_MS = 3000;

// The API returns ISO 3166 codes; the dataset uses Eurostat's, which only differ for Greece.
const EUROSTAT_CODES = { GR: 'EL' };

class ReaderCountry {
  iso = $state(null);
  #requested = false;

  async detect() {
    if (this.#requested) return;
    this.#requested = true;

    try {
      const response = await fetch(IP_API_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!response.ok) return;

      const { countryCode } = await response.json();
      if (countryCode) this.iso = EUROSTAT_CODES[countryCode] ?? countryCode;
    } catch {
      // No highlight: the chart reads the same without it.
    }
  }
}

export const readerCountry = new ReaderCountry();
