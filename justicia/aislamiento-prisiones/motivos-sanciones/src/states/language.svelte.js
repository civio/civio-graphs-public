import { formatDecimals, formatIntegers } from '../utils/locale';

// Comes from https://observablehq.com/@civio/automatizar-traducciones-visualizaciones
const texts = {
  es: {
    title: 'Motivos de las sanciones de aislamiento en España entre 2020 y 2025',
    notes: '* Los datos de 2025 corresponden solo al primer semestre.',

    source: `Fuente: Solicitudes de información a Instituciones Penitenciarias del Ministerio de Interior, la Secretaria de Mesures Penals, Reinserció i Atenció a la Víctima de Cataluña. País Vasco no ha facilitado datos.`,
    methodology: 'Para saber más, consulta nuestra ',
    methodologyLink: 'metodología',

    cases: ' sanciones',

    age: 'AGE',
    cat: 'Cataluña',

    sexAll: 'Todos',
    sexMen: 'Hombres',
    sexWomen: 'Mujeres',

    // Share/embed texts
    embedViz: 'Incrustar',
    copiedCode: 'Copiado',

    // Accessibility texts
    shareButton: 'Compartir visualización',
    closeShare: 'Cerrar opciones de compartir',
    copyEmbed: 'Copiar código para incrustar',
    codeCopied: 'Código copiado al portapapeles',
    close: 'Cerrar',
    closeTooltip: 'Cerrar detalle del motivo',
    selectorLegendAdm: 'Administración:',
    selectorLegendSex: 'Sexo:',
    selectorLegendYear: 'Año:',
    sexLabels: { '': 'Todos', V: 'Hombres', M: 'Mujeres' },
    tooltipDetail: 'Detalle del motivo',

    causes: {
      '108a': {
        type: 'muy grave',
        violent: false,
        label:
          'Participar en motines, plantes o desórdenes colectivos, o instigar a los mismos si éstos se hubieran producido.',
        labelShort: 'Motines',
      },
      '108b': {
        type: 'muy grave',
        violent: true,
        label:
          'Agredir, amenazar o coaccionar a cualesquiera personas dentro del establecimiento o a las autoridades o funcionarios judiciales o de instituciones penitenciarias, tanto dentro como fuera del establecimiento si el interno hubiera salido con causa justificada durante su internamiento y aquéllos se hallaren en el ejercicio de sus cargos o con ocasión de ellos',
        labelShort: 'Agresiones, amenazas o coacciones a funcionarios',
      },
      '108c': {
        type: 'muy grave',
        violent: true,
        label: 'Agredir o hacer objeto de coacción grave a otros internos',
        labelShort: 'Agresiones o coacciones a otros reclusos',
      },
      '108d': {
        type: 'muy grave',
        violent: false,
        label:
          'La resistencia activa y grave al cumplimiento de las órdenes recibidas de autoridad o funcionario en ejercicio legítimo de sus atribuciones',
        labelShort: 'Resistencia activa y grave',
      },
      '108e': {
        type: 'muy grave',
        violent: false,
        label: 'Intentar, facilitar o consumar la evasión',
        labelShort: 'Evasión',
      },
      '108f': {
        type: 'muy grave',
        violent: false,
        label:
          'Inutilizar deliberadamente las dependencias, materiales o efectos del establecimiento o las pertenencias de otras personas causando daños de elevada cuantía',
        labelShort: 'Daños graves en instalaciones',
      },
      '108g': {
        type: 'muy grave',
        violent: false,
        label:
          'La sustracción de materiales o efectos del establecimiento o de las pertenencias de otras personas',
        labelShort: 'Robo',
      },
      '108h': {
        type: 'muy grave',
        violent: false,
        label:
          'La divulgación de noticias o datos falsos, con la intención de menoscabar la seguridad del establecimiento',
        labelShort: 'Divulgación de bulos (contra la seguridad del centro)',
      },
      '108i': {
        type: 'muy grave',
        violent: false,
        label: 'Atentar contra la decencia pública con actos de grave escándalo y trascendencia',
        labelShort: 'Contra la decencia pública',
      },

      '109a': {
        type: 'grave',
        violent: false,
        label:
          'Calumniar, injuriar, insultar y faltar gravemente al respeto y consideración debidos a las autoridades, funcionarios y personas del apartado b) del artículo anterior, en las circunstancias y lugares que en el mismo se expresan',
        labelShort: 'Insultos a funcionarios',
      },
      '109b': {
        type: 'grave',
        violent: false,
        label:
          'Desobedecer las órdenes recibidas de autoridades o funcionarios en el ejercicio legítimo de sus atribuciones o resistirse pasivamente a cumplirlas',
        labelShort: 'Desobediencia, resistencia pasiva',
      },
      '109c': {
        type: 'grave',
        violent: false,
        label:
          'Instigar a otros reclusos a motines, plantes o desórdenes colectivos, sin conseguir ser secundados por éstos',
        labelShort: 'Instigación no secundada',
      },
      '109d': {
        type: 'grave',
        violent: false,
        label: 'Insultar a otros reclusos o maltratarles de obra',
        labelShort: 'Insultos a otros reclusos',
      },
      '109e': {
        type: 'grave',
        violent: false,
        label:
          'Inutilizar deliberadamente las dependencias, materiales o efectos del establecimiento o las pertenencias de otras personas causando daños de escasa cuantía, así como causar en los mismos bienes daños graves por negligencia temeraria',
        labelShort: 'Daños leves o por negligencia',
      },
      '109f': {
        type: 'grave',
        violent: false,
        label:
          'Introducir, hacer salir o poseer en el establecimiento objetos que se hallaren prohibidos por las normas de régimen interior',
        labelShort: 'Tener objetos prohibidos',
      },
      '109g': {
        type: 'grave',
        violent: false,
        label:
          'Organizar o participar en juegos de suerte, envite o azar, que no se hallaren permitidos en el establecimiento',
        labelShort: 'Juegos no permitidos',
      },
      '109h': {
        type: 'grave',
        violent: false,
        label:
          'La divulgación de noticias o datos falsos, con la intención de menoscabar la buena marcha regimental del establecimiento',
        labelShort: 'Divulgación de bulos (contra el buen funcionamiento)',
      },
      '109i': {
        type: 'grave',
        violent: false,
        label:
          'La embriaguez producida por el abuso de bebidas alcohólicas autorizadas que cause grave perturbación en el establecimiento o por aquellas que se hayan conseguido o elaborado de forma clandestina, así como el uso de drogas tóxicas, sustancias psicotrópicas o estupefacientes, salvo prescripción facultativa',
        labelShort: 'Alcohol o drogas',
      },
    },

    // Chart descriptions for screen readers
    a11y: {
      descriptions: {
        'AGE-Todos':
          'Gráfico de cuadrados proporcionales que muestra los motivos de las sanciones más comunes en toda la población presa de la AGE (Administración General del Estado), con datos desde 2020 al primer semestre de 2025. En 2020 destacan las agresiones o coacciones a otros reclusos (34%), a funcionarios (21%) y la resistencia activa grave (15%). En 2025, los más destacados son las agresiones o coacciones a otros reclusos (26%), los insultos a otros reclusos (20%) y tener objetos prohibidos (15%).',
        'Cataluña-Todos':
          'En Cataluña, para toda la población presa, en los datos del último semestre de 2025 destacan como motivo de sanción las agresiones o coacciones a otros reclusos (28%), las agresiones, amenazas o coacciones a funcionarios (26%) y la resistencia activa y grave (16%). Son datos parecidos a los de 2020 menos en el caso de las agresiones a otros reclusos, que en ese año suponían el 31% de las sanciones.',
        'AGE-Mujeres':
          'En el caso de las mujeres presas en la AGE (tan solo 2,8k sanciones impuestas a presas, en comparación con las 43,6k sanciones a presos), destacan por encima del resto dos motivos: las agresiones o coacciones a otras reclusas (33%) y los insultos a otros reclusos (33%). En 2020, las agresiones a otras reclusas suponían el 35% de las sanciones y los insultos, el 21%, y las agresiones a funcionarios suponían el 17% de las sanciones, frente al 5% en 2025',
        'Cataluña-Mujeres':
          'En el caso de mujeres presas en Cataluña (tan solo 2,2k sanciones impuestas a presas, en comparación con las 38,9k sanciones a presos), destacan tres motivos: agresiones o coacciones a otros reclusos (30%), agresiones, amenazas o coacciones a funcionarios (21%) y resistencia activa y grave (20%). En 2020 las agresiones a otros reclusos suponían el 37% de las sanciones, mientras que las agresiones a funcionarios en ese año fueron el 14%, pero en 2022 llegaron a suponer el 26% del total.',
        'AGE-Hombres':
          'Los motivos de sanciones para hombres presos en la AGE son análogos a los del total de población presa, con una diferencia de menos del 1%, ya que las sanciones a hombres presos suponen el 94% sobre el total de sanciones.',
        'Cataluña-Hombres':
          'Los motivos de sanciones para hombres presos en Cataluña son análogos a los del total de población presa, con una diferencia de menos del 1%, ya que las sanciones a hombres presos suponen el 95% sobre el total de sanciones.',
      },
      tableTitle: 'Desglose de sanciones de aislamiento por motivo y año',
      followingTable:
        'A continuación tienes la tabla con todos los datos de la serie temporal, entre 2020 y 2025:',
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
  formatCompact = $derived((n) => {
    const sep = this.value === 'es' ? ',' : '.';
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.', sep) + 'k';
    return String(n);
  });
}
export const vizLang = new Lang();
