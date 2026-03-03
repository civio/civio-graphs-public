import { formatIntegers } from '../utils/locale';

// Comes from https://observablehq.com/@civio/automatizar-traducciones-visualizaciones
const texts = {
  es: {
    title: {
      sancion:
        'Sanciones de aislamiento en la <span style="--highlight-color:var(--age)">AGE</span>, <span style="--highlight-color:var(--cat)">Cataluña</span> y <span style="--highlight-color:var(--pv)">País Vasco</span>',
      proteccion:
        'Asilamientos por protección del preso en la <span style="--highlight-color:var(--age)">AGE</span>, <span style="--highlight-color:var(--cat)">Cataluña</span> y <span style="--highlight-color:var(--pv)">País Vasco</span>',
    },

    source: `Fuente: solicitudes de información a Instituciones Penitenciarias del Ministerio de Interior, la Secretaria de Mesures Penals, Reinserció i Atenció a la Víctima de Cataluña y la Dirección de Servicios del Departamento de Justicia y Derechos Humanos del Gobierno vasco.`,
    methodology: 'Para saber más, consulta nuestra ',
    methodologyLink: 'metodología',
    note: {
      sancion: '* Los datos de 2025 corresponden solo al primer semestre.',
      proteccion: '* Los datos de 2025 corresponden solo al primer semestre.',
    },

    // Chart UI texts
    ratioLabel: {
      sancion: 'Sanciones por cada 1.000 presos',
      proteccion: 'Casos por cada 1.000 presos',
    },
    totalLabel: { sancion: 'Sanciones totales', proteccion: 'Casos totales' },
    valueTypeLabel: 'Tipo de valor mostrado',
    legendIsolation: 'Aislamiento en celda',
    legendWeekend: 'Fin de semana',

    // Tooltip texts
    tooltipTitle: {
      sancion: 'Sanciones en {year}',
      proteccion: 'Casos en {year}',
    },
    tooltipRatioSuffix: {
      sancion: 'sanciones por cada mil presos',
      proteccion: 'casos por cada mil presos',
    },
    tooltipTotalSuffix: { sancion: 'sanciones', proteccion: 'casos' },
    closeTooltip: 'Cerrar detalle',

    // Share/embed texts
    embedViz: 'Incrustar',
    copiedCode: 'Copiado',

    // Accessibility texts
    shareButton: 'Compartir visualización',
    closeShare: 'Cerrar opciones de compartir',
    copyEmbed: 'Copiar código para incrustar',
    codeCopied: 'Código copiado al portapapeles',

    barAriaLabel: {
      sancion: 'Ver sanciones de {year}',
      proteccion: 'Ver aislamientos de {year}',
    },

    // Chart descriptions for screen readers
    a11y: {
      admDict: { AGE: 'España', CAT: 'Cataluña', PV: 'País Vasco' },
      catDict: {
        legal: 'Menos de 15 días',
        over_onu: 'Entre 15 y 42 días',
        over_esp: 'Más de 42 días',
      },
      mainChart: {
        sancion: {
          description:
            'Gráfico de barras apiladas que muestra las sanciones de aislamiento en celda y de fin de semana por administración penitenciaria (AGE –Administración General del Estado–, Cataluña y País Vasco) y año. En valores absolutos, la AGE acumula el mayor número de sanciones con cierta estabilidad hasta 2023 y un descenso en 2024, mientras que Cataluña muestra un fuerte crecimiento llegando a superar las cifras de la AGE. País Vasco parte de cifras muy bajas con tendencia al alza. En términos relativos (por cada 1.000 presos), Cataluña presenta tasas muy superiores al resto de administraciones, superando incluso las 1.000 sanciones por cada 1.000 presos en 2023; la cifra más elevada de la AGE fueron 208 sanciones por cada 1000 presos en 2022.',
          title: 'Sanciones de aislamiento por administración y año',
        },
        proteccion: {
          description:
            'Gráfico de barras que muestra los aislamientos por protección por administración penitenciaria (AGE –Administración General del Estado–, Cataluña y País Vasco) y año. En valores absolutos, la AGE concentra la mayoría de aislamientos por protección con una tendencia creciente hasta 2023, con 1.642 casos, mientras que Cataluña muestra un descenso sostenido, y País Vasco parte de cifras muy bajas pero en aumento. En términos relativos, Cataluña presenta tasas muy superiores al resto, con 68 casos por cada mil presos en 2020 frente a los 26 de la AGE, aunque decrecientes, y País Vasco muestra el mayor crecimiento proporcional, pasando de 12 aislamientos por cada 1000 presos en 2022 a 17 en el primer semestre de 2025.',
          title: 'Aislamientos por proteccion por administración y año',
        },
      },
      followingList: 'A continuación tienes el listado con todos los detalles.',
      followingTable: 'A continuación tienes la tabla con todos los detalles.',
    },
  },
};

class Lang {
  value = $state('es');

  setLang(lang) {
    this.value = texts[lang] ? lang : 'es';
  }

  texts = $derived(texts[this.value]);
  formatIntegers = $derived(formatIntegers[this.value] ?? formatIntegers['es']);
}
export const vizLang = new Lang();
