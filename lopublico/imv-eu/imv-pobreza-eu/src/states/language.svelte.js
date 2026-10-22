import { formatDecimals, formatIntegers, formatEuros } from '../utils/locale';

// Comes from https://observablehq.com/@civio/automatizar-traducciones-visualizaciones
const texts = {
  es: {
    // The title is also the legend: keep each <span> around its words, wherever they end up.
    title:
      'Distancia entre las <span class="mark-benefit">rentas mínimas</span> en Europa y el <span class="mark-threshold">umbral de pobreza</span>',

    householdLegend: 'Tipo de hogar',
    household: {
      single: 'Persona sola',
      couple: 'Pareja',
      family: 'Pareja con 2 hijos',
    },

    // By Eurostat code (Greece is EL, not GR)
    countries: {
      AT: 'Austria',
      BE: 'Bélgica',
      BG: 'Bulgaria',
      CY: 'Chipre',
      CZ: 'República Checa',
      DE: 'Alemania',
      DK: 'Dinamarca',
      EE: 'Estonia',
      EL: 'Grecia',
      ES: 'España',
      FI: 'Finlandia',
      FR: 'Francia',
      HR: 'Croacia',
      HU: 'Hungría',
      IE: 'Irlanda',
      IT: 'Italia',
      LT: 'Lituania',
      LU: 'Luxemburgo',
      LV: 'Letonia',
      MT: 'Malta',
      NL: 'Países Bajos',
      PL: 'Polonia',
      PT: 'Portugal',
      RO: 'Rumanía',
      SE: 'Suecia',
      SI: 'Eslovenia',
      SK: 'Eslovaquia',
    },
    noData: 'Sin datos',
    interactionHint:
      'Filtra por tipo de hogar y por umbral, y pasa el ratón por un país ↓ para ver sus cifras.',
    interactionHintTouch:
      'Filtra por tipo de hogar y por umbral, y toca un país ↓ para ver sus cifras.',
    // With its article: it goes inside sentences ({household} in tooltip and a11y).
    householdNarrative: {
      single: 'una persona sola',
      couple: 'una pareja',
      family: 'una pareja con 2 hijos',
    },
    // Tooltip: one country, the household selected in the filter. Keep the tags around the same
    // words: <b> bold, <strong> bold in the colour of the bar, <i> italics.
    // {household} comes from householdNarrative, {scheme} is the programme's own name (untranslated,
    // from the data) and {term} is povertyTerm or extremeTerm.
    tooltip: {
      // → «En Chipre, una persona sola cobra como máximo 480 € del Ελάχιστο Εγγυημένο Εισόδημα.»
      benefit:
        'En <b>{country}</b>, <b>{household}</b> cobra como máximo {amount} del <i>{scheme}</i>.',
      // When the data gives no programme name
      // → «En Francia, una pareja cobra como máximo 963 € de renta mínima.»
      benefitNoScheme:
        'En <b>{country}</b>, <b>{household}</b> cobra como máximo {amount} de renta mínima.',
      // Follows benefit («esta cantidad» is that amount)
      // → «Esta cantidad está un 56,50 % por debajo del umbral de pobreza del país (1.103 €).»
      below:
        'Esta cantidad está <strong>un {pct} por debajo</strong> del <b>{term}</b> del país ({threshold}).',
      // → «Esta cantidad está un 28,79 % por encima del umbral de pobreza del país (2.714 €).»
      above:
        'Esta cantidad está <strong>un {pct} por encima</strong> del <b>{term}</b> del país ({threshold}).',
      // → «En Bélgica, no hay datos claros sobre la cuantía de la renta mínima para una pareja
      //   con 2 hijos.»
      noAmount:
        'En <b>{country}</b>, no hay datos claros sobre la cuantía de la renta mínima para <b>{household}</b>.',
      // → «No se dispone del umbral de pobreza severa del país.»
      noThreshold: 'No se dispone del <b>{term}</b> del país.',
    },

    // Axis titles, one per side. {reference} comes from referenceNoun
    // → «% que falta para salir de la pobreza» · «% por encima de la pobreza severa»
    axisTitleShortfall: '% que falta para salir de {reference}',
    axisTitleSurplus: '% por encima de {reference}',
    referenceNoun: {
      poverty: 'la pobreza',
      extreme: 'la pobreza severa',
    },
    // Threshold selector
    referenceLegend: 'Umbral de referencia',
    referencePoverty: 'Umbral de pobreza',
    referenceExtreme: 'Umbral de pobreza severa',
    // {term} inside tooltip and screen reader sentences
    povertyTerm: 'umbral de pobreza',
    extremeTerm: 'umbral de pobreza severa',
    // Short labels on the chart, between tick labels. `\n` is a line break.
    thresholdMark: 'Pobreza',
    extremeMark: 'Pobreza\nsevera',

    noRatio: 'Sin datos',
    // noteLabel goes apart because thresholdNote also opens the screen reader description.
    noteLabel: 'Nota:',
    thresholdNote:
      'El umbral de pobreza es el 60 % de la mediana de ingresos de cada país, y el de pobreza severa, el 40 %; ambos, con datos de 2025.',
    // → «…Países excluidos por falta de datos claros sobre la cuantía de la renta mínima:
    //   Eslovaquia, Hungría, Polonia, Rumanía.»
    excludedNote:
      'Las rentas mínimas son de <b>enero de 2026</b>. Países excluidos por falta de datos claros sobre la cuantía de la renta mínima: {countries}.',
    loading: 'Cargando datos…',
    loadError: 'No se han podido cargar los datos',

    source: `Fuente: <a target="_blank" href="https://www.missoc.org/">MISSOC</a>, <a target="_blank" href="https://ec.europa.eu/eurostat/databrowser/view/ilc_li03/default/table?lang=en">Eurostat</a> y páginas oficiales. `,
    // {link} is methodologyLink, as a link → «Para saber más, consulta nuestra metodología.»
    methodology: 'Para saber más, consulta nuestra {link}.',
    methodologyLink: 'metodología',

    // Share/embed texts
    embedViz: 'Incrustar',
    copiedCode: 'Copiado',

    // Accessibility texts
    shareButton: 'Compartir visualización',
    closeShare: 'Cerrar opciones de compartir',
    closeTooltip: 'Cerrar detalle',
    copyEmbed: 'Copiar código para incrustar',
    codeCopied: 'Código copiado al portapapeles',
    loadingEmbed: 'Cargando código…',
    embedError: 'Error al copiar el código',
    opensInNewWindow: '(abre en nueva ventana)',
    logoAlt: 'logo Civio',
    dataListTitle: 'Listado completo de datos',

    // Screen reader texts, heard rather than seen: keep the wording of the tooltip and the title
    // («distancia», «por debajo» / «por encima»). Assembled in a11y/mainChart.js.
    a11y: {
      mainChart: {
        // Opens the description, followed by thresholdNote and howToRead
        // → «Gráfico de puntos con la distancia entre las rentas mínimas y el umbral de pobreza,
        //   o el de pobreza severa, en 23 países europeos y para tres tipos de hogar: una persona
        //   sola, una pareja y una pareja con 2 hijos.»
        shape:
          'Gráfico de puntos con la distancia entre las rentas mínimas y el umbral de pobreza, o el de pobreza severa, en {count} países europeos y para tres tipos de hogar: {households}.',
        howToRead:
          'Una línea vertical marca el umbral: a la izquierda, en rosa, las rentas que quedan por debajo; a la derecha, en azul, las que quedan por encima.',
        // Closes the summary. A state, not an event: it is also read when nothing has changed.
        tableHint: 'La tabla del final recoge el detalle por país.',

        // Countries above the selected threshold: one of the four, depending on how many.
        // → «En ningún país ni tipo de hogar la renta mínima queda por encima del umbral de
        //   pobreza severa.»
        aboveNone: 'En ningún país ni tipo de hogar la renta mínima queda por encima del {term}.',
        // {countries} is a list of countryHouseholds
        // → «La renta mínima solo queda por encima del umbral de pobreza en Luxemburgo para una
        //   pareja y en Dinamarca para una pareja y una pareja con 2 hijos.»
        aboveList: 'La renta mínima solo queda por encima del {term} {countries}.',
        // One item in the list inside aboveList. {country} is a country name; {households} is a
        // comma-joined list from householdNarrative, or allHouseholds.
        // → aboveList fills {countries} with e.g. «en Luxemburgo para una pareja y en Dinamarca
        //   para una pareja y una pareja con 2 hijos»
        // Repeating «en» before each country prevents the two lists from running together by ear.
        countryHouseholds: 'en {country} para {households}',
        allHouseholds: 'todos los hogares',
        // → «Según el tipo de hogar, entre 2 y 6 países tienen una renta mínima por encima del
        //   umbral de pobreza severa.»
        aboveRange:
          'Según el tipo de hogar, entre {min} y {max} países tienen una renta mínima por encima del {term}.',
        // → «En cada tipo de hogar, 3 países tienen una renta mínima por encima del umbral de
        //   pobreza.»
        aboveSame:
          'En cada tipo de hogar, {count} países tienen una renta mínima por encima del {term}.',

        // One item for the focus country (Spain). Joined with commas and used as {items} in
        // focusBelowList/focusAboveList, or as {above}/{below} in focusMixedList.
        // → «un 28 % para una persona sola, un 38 % para una pareja y un 35 % para una pareja
        //   con 2 hijos»
        focusItem: 'un {pct} para {household}',
        // → «En España, la renta mínima está por debajo del umbral de pobreza: un 28 % para una
        //   persona sola, un 38 % para una pareja y un 35 % para una pareja con 2 hijos.»
        focusBelowList: 'En {country}, la renta mínima está por debajo del {term}: {items}.',
        focusAboveList: 'En {country}, la renta mínima está por encima del {term}: {items}.',
        // → «En España, la renta mínima está por encima del umbral de pobreza severa un 8 % para
        //   una persona sola, y por debajo un 6 % para una pareja y un 2 % para una pareja con
        //   2 hijos.»
        focusMixedList:
          'En {country}, la renta mínima está por encima del {term} {above}, y por debajo {below}.',

        // Table caption. The figures in the table carry a sign (−27,96 %, +28,79 %).
        title:
          'Distancia entre la renta mínima y el {term}, por tipo de hogar. En negativo, por debajo; en positivo, por encima.',
        countryColumn: 'País',
      },
      // Under the household filter, announced every time it changes: keep it short.
      // {household} is the filter's own label.
      // → «Pareja: por debajo del umbral de pobreza en 21 de 23 países.»
      scenario: {
        householdChanged: '{household}:',
        someReach: 'por debajo del {term} en {below} de {count} países.',
        // When every country is below → «Persona sola: por debajo del umbral de pobreza en los
        // 23 países.»
        noneReach: 'por debajo del {term} en los {count} países.',
      },
      followingList: 'A continuación tienes el listado con todos los detalles.',
      followingTable: 'A continuación tienes la tabla con todos los detalles.',
    },
  },
  en: {
    title:
      'Difference between <span class="mark-benefit">minimum income benefit</span> and <span class="mark-threshold">poverty line</span> in Europe',

    householdLegend: 'Household type',
    household: {
      single: 'Single person',
      couple: 'Couple',
      family: 'Couple with 2 children',
    },
    // By Eurostat code (Greece is EL, not GR)
    countries: {
      AT: 'Austria',
      BE: 'Belgium',
      BG: 'Bulgaria',
      CY: 'Cyprus',
      CZ: 'Czechia',
      DE: 'Germany',
      DK: 'Denmark',
      EE: 'Estonia',
      EL: 'Greece',
      ES: 'Spain',
      FI: 'Finland',
      FR: 'France',
      HR: 'Croatia',
      HU: 'Hungary',
      IE: 'Ireland',
      IT: 'Italy',
      LT: 'Lithuania',
      LU: 'Luxembourg',
      LV: 'Latvia',
      MT: 'Malta',
      NL: 'Netherlands',
      PL: 'Poland',
      PT: 'Portugal',
      RO: 'Romania',
      SE: 'Sweden',
      SI: 'Slovenia',
      SK: 'Slovakia',
    },
    noData: 'No data',
    interactionHint:
      'Filter by household type and poverty line, and hover over a country name ↓ to see its figures.',
    interactionHintTouch:
      'Filter by household type and poverty line, and touch a country name ↓ to see its figures.',
    householdNarrative: {
      single: 'a single person',
      couple: 'a couple',
      family: 'a couple with 2 children',
    },
    tooltip: {
      // → «In Cyprus, a single person gets a maximum income benefit of 480 € from the Ελάχιστο…»
      benefit:
        'In <b>{country}</b>, <b>{household}</b> gets a maximum income benefit of {amount} from the <i>{scheme}</i>.',
      // When the data gives no programme name
      benefitNoScheme:
        'In <b>{country}</b>, <b>{household}</b> gets a maximum income benefit of {amount}.',
      // {term} is already «poverty line» / «severe poverty line»
      below: 'This amount is <strong>{pct} below</strong> the <b>{term}</b> ({threshold}).',
      above: 'This amount is <strong>{pct} above</strong> the <b>{term}</b> ({threshold}).',
      noAmount:
        'In <b>{country}</b>, we lack clear data on the income benefit for <b>{household}</b>.',
      noThreshold: 'We lack the <b>{term}</b> for this country.',
    },

    axisTitleShortfall: '% to escape {reference}',
    axisTitleSurplus: '% above {reference}',
    referenceNoun: {
      poverty: 'poverty',
      extreme: 'severe poverty',
    },
    referenceLegend: 'Reference value',
    referencePoverty: 'Poverty line',
    referenceExtreme: 'Severe poverty line',
    // Lower case: they go mid-sentence (the selector labels above are the capitalised ones)
    povertyTerm: 'poverty line',
    extremeTerm: 'severe poverty line',
    thresholdMark: 'Poverty',
    extremeMark: 'Severe\npoverty',

    noRatio: 'No ratio',
    noteLabel: 'Note:',
    thresholdNote:
      'We set the poverty threshold at 60% of national median income and the severe poverty line at 40% of national median income.',
    excludedNote:
      'Minimum income data is from <b>January 2026</b>. Countries excluded due to unclear minimum income data: {countries}.',
    loading: 'Loading data…',
    loadError: 'Could not load the data',

    source: `Source: <a target="_blank" href="https://www.missoc.org/">MISSOC</a>, <a target="_blank" href="https://ec.europa.eu/eurostat/databrowser/view/ilc_li03/default/table?lang=en">Eurostat</a> and official sources. `,
    methodology: 'To learn more, see our {link}.',
    methodologyLink: 'methodology',

    // Share/embed texts
    embedViz: 'Embed',
    copiedCode: 'Copied',

    // Accessibility texts
    shareButton: 'Share visualization',
    closeShare: 'Close share options',
    closeTooltip: 'Close detail',
    copyEmbed: 'Copy embed code',
    codeCopied: 'Code copied to clipboard',
    loadingEmbed: 'Loading code…',
    embedError: 'Error copying code',
    opensInNewWindow: '(opens in new window)',
    logoAlt: 'Civio logo',
    dataListTitle: 'Full data listing',

    // Screen reader texts
    a11y: {
      mainChart: {
        shape:
          'Dot chart showing how far the minimum income falls short of the poverty threshold, or of the severe poverty threshold, in {count} European countries and for three household types: {households}.',
        howToRead:
          'A vertical line marks the threshold: to its left, in pink, the countries that fall below it; to its right, in blue, those that go above it.',
        tableHint: 'The table at the end has the detail country by country.',
        aboveNone:
          'Against the {term}, the minimum income does not go above it in any country or household type.',
        // {countries} already starts with «in» (countryHouseholds)
        aboveList: 'Against the {term}, the minimum income only goes above it {countries}.',
        countryHouseholds: 'in {country} for {households}',
        allHouseholds: 'all households',
        aboveRange:
          'Depending on the household type, from {min} to {max} countries have a minimum income benefit above {term}.',
        aboveSame:
          'In each type of household {count} countries have a minimum income benefit above {term}.',
        focusItem: 'a {pct} for {household}',
        focusBelowList: 'In {country} the minimum income benefit is below {term}: {items}.',
        focusAboveList: 'In {country} the minimum income benefit is above {term}: {items}.',
        focusMixedList:
          'In {country}, the income benefit is above the {term} {above} and below {below}.',
        title:
          'Difference between income benefit and {term}, by household type. Negative means below and positive above the poverty line.',
        countryColumn: 'Country',
      },
      scenario: {
        householdChanged: '{household}:',
        someReach: 'below {term} in {below} of {count} countries.',
        noneReach: 'below {term} in {count} countries.',
      },
      followingList: 'The following list has all the details.',
      followingTable: 'The following table has all the details.',
    },
  },
};

class Lang {
  value = $state('es');

  setLang(lang) {
    this.value = texts[lang] ? lang : 'es';
  }

  texts = $derived(texts[this.value]);
  formatDecimals = $derived(formatDecimals[this.value] ?? formatDecimals['es']);
  formatIntegers = $derived(formatIntegers[this.value] ?? formatIntegers['es']);
  formatEuros = $derived(formatEuros[this.value] ?? formatEuros['es']);
}
export const vizLang = new Lang();
