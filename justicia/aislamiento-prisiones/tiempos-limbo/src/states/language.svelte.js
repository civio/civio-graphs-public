import { formatDecimals, formatIntegers } from '../utils/locale';

// Comes from https://observablehq.com/@civio/automatizar-traducciones-visualizaciones
const texts = {
  es: {
    title: 'Duración de los aislamientos por protección del preso entre 2020 y 2025',

    source: `Fuente: solicitudes de información a Instituciones Penitenciarias del Ministerio de Interior, la Secretaria de Mesures Penals, Reinserció i Atenció a la Víctima de Cataluña y la Dirección de Servicios del Departamento de Justicia y Derechos Humanos del Gobierno vasco.`,
    methodology: 'Para saber más, consulta nuestra ',
    methodologyLink: 'metodología',
    note: '* Solo se tienen en cuenta los aislamientos que ya han terminado. Los datos de 2025 corresponden solo al primer semestre.',

    // Group labels for waffle chart (used in both visual and a11y)
    groupLabels: {
      '<= 15': '15 días o menos',
      '>15 & <= 30': 'Entre 16 y 30 días',
      '>30 & <= 93': 'Entre 1 y 3 meses',
      '>93 & <= 365': 'Entre 3 meses y 1 año',
      '> 365': 'Más de 1 año',
    },

    // Share/embed texts
    embedViz: 'Incrustar',
    copiedCode: 'Copiado',

    // Accessibility texts
    shareButton: 'Compartir visualización',
    closeShare: 'Cerrar opciones de compartir',
    copyEmbed: 'Copiar código para incrustar',
    codeCopied: 'Código copiado al portapapeles',

    // Chart descriptions for screen readers
    a11y: {
      mainChart: {
        description:
          'Gráfico de cuadrados que muestra la duración de los aislamientos por protección del preso. Casi la mitad (48%) duran 15 días o menos, el máximo recomendado por la ONU. Sin embargo, el 52% superan esta recomendación. Un 20% se prolongan entre 16 y 30 días, un 25% ha estado entre 1 y 3 meses y hay casos en los que se supera el año.',
        title: 'Duración de los aislamientos por protección del preso',
        columns: ['Duración', 'Aislamientos', 'Porcentaje'],
      },
      followingList: 'A continuación tienes el listado con todos los detalles.',
      followingTable: 'A continuación tienes la tabla con todos los detalles.',
    },
  },
};

class Lang {
  value = $state('es');

  setLang(lang) {
    if (texts[lang]) {
      this.value = lang;
    } else {
      this.value = 'es';
    }
  }

  texts = $derived(texts[this.value]);
  formatDecimals = $derived(formatDecimals[this.value] ?? formatDecimals['es']);
  formatIntegers = $derived(formatIntegers[this.value] ?? formatIntegers['es']);
}
export const vizLang = new Lang();
