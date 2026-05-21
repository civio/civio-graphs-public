import { formatDecimals, formatIntegers } from '../utils/locale';
import { ccaaDisplayNames } from './ccaaCatalog';

// Comes from https://observablehq.com/@civio/automatizar-traducciones-visualizaciones
const texts = {
  es: {
    title: 'Plazos de protección vigentes de las VPOs según normas estatales y autonómicas',
    source:
      'Fuente: elaboración propia a partir de los boletines oficiales estatales y autonómicos.',
    methodology: 'Para saber más, consulta nuestra ',
    methodologyLink: 'metodología',

    // Share/embed texts
    embedViz: 'Incrustar',
    copiedCode: 'Copiado',

    // Accessibility texts
    shareButton: 'Compartir visualización',
    closeShare: 'Cerrar opciones de compartir',
    copyEmbed: 'Copiar código para incrustar',
    codeCopied: 'Código copiado al portapapeles',
    loadingEmbed: 'Cargando código…',
    embedError: 'Error al copiar el código',
    opensInNewWindow: '(abre en nueva ventana)',
    logoAlt: 'logo Civio',

    intro: {
      subtitle: (isMobile) =>
        `${isMobile ? 'Pulsa en' : 'Haz click en '} cada comunidad para desplegar los tipos de viviendas, y ${isMobile ? 'pulsa en ellos' : 'pasa por encima '} para ver más información en detalle`,
      yearsLegendLabel: 'Años de protección',
      howToReadTitle: 'Cómo leer',
      exampleTypes: ['Tipo A', 'Tipo B', 'Tipo C'],
      exampleAriaLabel: 'Cada franja oblicua es un tipo de vivienda',
      housingTypesNote: ['tipos de', 'vivienda'],
    },

    legend: {
      minYears: '5 años',
      maxYears: '90 años',
      permanent: 'Permanente',
    },

    chart: {
      loading: 'Cargando datos…',
      error: (msg) => `Error al cargar los datos: ${msg}`,
      noData: 'Sin datos',
      ariaLabel: 'Plazos vigentes VPO por comunidad',
    },

    tooltip: {
      permanent: 'Permanente',
      yearsSuffix: 'años',
      allHouses: 'Todas las viviendas públicas',
      protectionPrefix: 'Protección',
      protectionDuringPrefix: 'Protección durante',
      protectionRangePrefix: 'Protección entre',
      protectionPermanentValue: 'permanente',
      yearsValue: (n) => `${n} años`,
      yearsRangeValue: (min, max) => `${min} y ${max} años`,
    },

    // Display labels keyed by canonical id, plus the special 'estatal'
    // pseudo-id used for state-level rows that don't belong to a CCAA.
    ccaas: { ...ccaaDisplayNames, estatal: 'Estatal' },

    a11y: {
      description:
        'Gráfico a modo de listado con los plazos de protección vigentes para las viviendas protegidas (VPO) en España en 2026, según la regulación estatal y la de cada comunidad autónoma. Cada fila muestra los distintos plazos de protección que se aplican a las VPO que existen actualmente en este territorio. Encabezan la lista, con plazos de protección más cortos (entre 7, 10 y 15 años según el tipo de vivienda) las comunidades de Madrid, Castilla y León y Andalucía. Cierran la lista, con plazos de protección permanentes para todos los tipos de vivienda, las comunidades de Islas Baleares, Navarra y País Vasco.',
      navHint:
        'A continuación tienes las listas con todos los detalles, usa las cabeceras para navegar entre comunidades. Dentro de cada una se enumeran los tipos de vivienda protegida con su plazo de protección.',
      summaryOne: '1 tipo de vivienda protegida.',
      summaryMany: (n) => `${n} tipos de vivienda protegida.`,
      noData: 'Sin datos disponibles.',
      permanent: 'protección permanente',
      years: (n) => `${n} ${n === 1 ? 'año' : 'años'} de protección`,
      yearsRange: (min, max) => `entre ${min} y ${max} años de protección`,
      yearsToPermanent: (min) => `desde ${min} años hasta protección permanente`,
      noteLabel: 'Nota',
    },
  },
};

class Lang {
  value = $state('es');

  setLang(lang) {
    this.value = texts[lang] ? lang : 'es';
  }

  ccaaLabel(slug) {
    return this.texts.ccaas?.[slug] ?? slug;
  }

  texts = $derived(texts[this.value]);
  formatDecimals = $derived(formatDecimals[this.value] ?? formatDecimals['es']);
  formatIntegers = $derived(formatIntegers[this.value] ?? formatIntegers['es']);
}
export const vizLang = new Lang();
