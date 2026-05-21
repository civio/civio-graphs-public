/**
 * Canonical CCAA catalog. Single source of truth for the 19 autonomous
 * communities. Keys are the lowercase ascii ids used across the project.
 *
 * Per CCAA:
 *   - `es`: display name shown to readers.
 *   - `ipRegions`: geojs.io english labels (array because MaxMind labels may
 *     drift; keeping them as data avoids a separate inverse map).
 *   - `csvAliases`: every raw value the CCAA may appear as in CSV/JSON data
 *     sources — legacy underscored ASCII (`Castilla_y_Leon`), short codes
 *     (`CLM`, `CyL`), bilingual variants (`Catalunya`, `Euskadi`,
 *     `Comunitat_Valenciana`) and the canonical Spanish name itself.
 *
 * Adding a CCAA = adding a row here + adding the data row in each consumer.
 * No other files need editing.
 */
export const CCAAS = {
	andalucia: {
		es: 'Andalucía',
		ipRegions: ['Andalusia'],
		csvAliases: ['Andalucia', 'Andalucía'],
	},
	aragon: {
		es: 'Aragón',
		ipRegions: ['Aragon'],
		csvAliases: ['Aragon', 'Aragón'],
	},
	asturias: {
		es: 'Asturias',
		ipRegions: ['Principality of Asturias'],
		csvAliases: ['Asturias'],
	},
	baleares: {
		es: 'Islas Baleares',
		ipRegions: ['Balearic Islands'],
		csvAliases: ['Balears', 'Baleares', 'I. Baleares', 'Illes Balears'],
	},
	canarias: {
		es: 'Canarias',
		ipRegions: ['Canary Islands'],
		csvAliases: ['Canarias'],
	},
	cantabria: {
		es: 'Cantabria',
		ipRegions: ['Cantabria'],
		csvAliases: ['Cantabria'],
	},
	castillalamancha: {
		es: 'Castilla-La Mancha',
		ipRegions: ['Castille-La Mancha'],
		csvAliases: ['Castilla_La_Mancha', 'CLM', 'Castilla-La Mancha'],
	},
	castillayleon: {
		es: 'Castilla y León',
		ipRegions: ['Castille and León'],
		csvAliases: ['Castilla_y_Leon', 'CyL', 'Castilla y León'],
	},
	cataluna: {
		es: 'Cataluña',
		ipRegions: ['Catalonia'],
		csvAliases: ['Cataluna', 'Catalunya', 'Cataluña'],
	},
	ceuta: {
		es: 'Ceuta',
		ipRegions: ['Ceuta'],
		csvAliases: ['Ceuta'],
	},
	extremadura: {
		es: 'Extremadura',
		ipRegions: ['Extremadura'],
		csvAliases: ['Extremadura'],
	},
	galicia: {
		es: 'Galicia',
		ipRegions: ['Galicia'],
		csvAliases: ['Galicia'],
	},
	larioja: {
		es: 'La Rioja',
		ipRegions: ['La Rioja'],
		csvAliases: ['Rioja', 'La Rioja'],
	},
	madrid: {
		es: 'Comunidad de Madrid',
		ipRegions: ['Madrid'],
		csvAliases: ['Madrid'],
	},
	melilla: {
		es: 'Melilla',
		ipRegions: ['Melilla'],
		csvAliases: ['Melilla'],
	},
	murcia: {
		es: 'Región de Murcia',
		ipRegions: ['Murcia'],
		csvAliases: ['Murcia'],
	},
	navarra: {
		es: 'Navarra',
		ipRegions: ['Navarre'],
		csvAliases: ['Navarra'],
	},
	paisvasco: {
		es: 'País Vasco',
		ipRegions: ['Basque Country'],
		csvAliases: ['Pais_Vasco', 'País Vasco', 'Euskadi'],
	},
	valencia: {
		es: 'Comunidad Valenciana',
		ipRegions: ['Valencia'],
		csvAliases: ['Comunitat_Valenciana', 'P. Valencià', 'C. Valenciana', 'Comunidad Valenciana'],
	},
};

// Derived: geojs.io english region → canonical id (IP-based detection).
export const ipRegionToId = Object.fromEntries(
	Object.entries(CCAAS).flatMap(([id, c]) => c.ipRegions.map((r) => [r, id]))
);

// Derived: display labels keyed by canonical id.
export const ccaaDisplayNames = Object.fromEntries(
	Object.entries(CCAAS).map(([id, c]) => [id, c.es])
);

// CCAAs cuyo nombre lleva artículo "la" cuando va precedido de preposición
// ("en la Comunidad de Madrid"). El resto se renderiza sin artículo.
const NEEDS_ARTICLE = new Set(['madrid', 'valencia', 'murcia']);

export const ccaasWithArticle = Object.fromEntries(
	Object.entries(CCAAS).map(([id, c]) => [id, NEEDS_ARTICLE.has(id) ? `la ${c.es}` : c.es])
);

// Derived: any known CSV/JSON alias → canonical id. Use to normalise raw
// values from heterogeneous data sources at ingest time.
export const csvAliasToId = Object.fromEntries(
	Object.entries(CCAAS).flatMap(([id, c]) => c.csvAliases.map((a) => [a, id]))
);
