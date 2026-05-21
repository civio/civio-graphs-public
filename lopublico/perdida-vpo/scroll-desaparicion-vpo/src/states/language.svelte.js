import { formatDecimals, formatIntegers } from '../utils/locale';

// Comes from https://observablehq.com/@civio/automatizar-traducciones-visualizaciones
const texts = {
  es: {
    title: 'Evolución de la vivienda protegida en España desde 1991',
    scrollHint: 'Haz scroll para continuar',

    source: `Fuente: <a href="https://www.mivau.gob.es/el-ministerio/observatorios-y-estadisticas/estadisticas/vivienda-rehabilitacion-protegidas" target="_blank">Estadísticas de vivienda y rehabilitación protegida del Ministerio de Vivienda y Agenda Urbana</a> y datos facilitados a Civio desde los gobiernos autonómicos a través de la Ley de Transparencia.`,
    methodology: 'Para saber más, consulta nuestra ',
    methodologyLink: 'metodología',

    // Scrollytelling structure (used as landmark label + per-step heading)
    narrativeRegionLabel:
      'Narrativa por pasos sobre la evolución del parque de vivienda protegida en España',
    stepLabel: (current, total, name) => `Paso ${current} de ${total}: ${name}`,

    // Visible-only alt text for journalists to copy alongside a screenshot
    // of the last (interactive) step. One template per dimension — picked
    // by the currently selected planView. Rendered exclusively in `?alt`
    // mode; not consumed by screen readers.
    altDescription: {
      protection: ({
        lastYear,
        projectionEnd,
        totalBuilt,
        permanent,
        protectedNum,
        maybe,
        lost,
        projectedPermanent,
        projectedProtected,
        projectedMaybe,
      }) =>
        `Gráfico de áreas apiladas con la evolución del parque de vivienda protegida en España entre 1991 y ${projectionEnd}, desglosado por estado de protección. En ${lastYear}, último año con datos reales, había ${totalBuilt} viviendas protegidas construidas: ${permanent} con protección permanente, ${protectedNum} con protección temporal, ${maybe} con posibilidad de descalificación voluntaria y ${lost} ya perdidas. A partir de ${lastYear + 1} los valores son una proyección que estima ${projectedPermanent} viviendas con protección permanente, ${projectedProtected} con protección temporal y ${projectedMaybe} que pueden haber sido descalificadas voluntariamente de forma anticipada en ${projectionEnd}.`,
      plan: ({
        lastYear,
        projectionEnd,
        totalBuilt,
        estatal,
        autonomico,
        sinInfo,
        projectedEstatal,
        projectedAutonomico,
        projectedSinInfo,
      }) =>
        `Gráfico de áreas apiladas con la evolución del parque de vivienda protegida en España entre 1991 y ${projectionEnd}, desglosado por plan. En ${lastYear}, último año con datos reales, había ${totalBuilt} viviendas protegidas construidas: ${estatal} de planes estatales, ${autonomico} de planes autonómicos y ${sinInfo} sin información del plan. A partir de ${lastYear + 1} los valores son una proyección que estima ${projectedEstatal} viviendas provenientes de planes estatales, ${projectedAutonomico} de planes autonómicos y ${projectedSinInfo} sin información del plan en ${projectionEnd}.`,
      promotor: ({
        lastYear,
        projectionEnd,
        totalBuilt,
        publico,
        privado,
        autopromotor,
        sinAnimoLucro,
        sinInfo,
        projectedPublico,
        projectedPrivado,
        projectedAutopromotor,
        projectedSinAnimoLucro,
        projectedSinInfo,
      }) =>
        `Gráfico de áreas apiladas con la evolución del parque de vivienda protegida en España entre 1991 y ${projectionEnd}, desglosado por tipo de promoción. En ${lastYear}, último año con datos reales, había ${totalBuilt} viviendas protegidas construidas: ${publico} de promoción pública, ${privado} de promoción privada, ${autopromotor} de autopromoción, ${sinAnimoLucro} de entidades sin ánimo de lucro y ${sinInfo} sin información de la promoción. A partir de ${lastYear + 1} los valores son una proyección que estima ${projectedPublico} viviendas de promoción pública, ${projectedPrivado} de promoción privada, ${projectedAutopromotor} de autopromoción, ${projectedSinAnimoLucro} de entidades sin ánimo de lucro y ${projectedSinInfo} sin información de la promoción en ${projectionEnd}.`,
      tenencia: ({
        lastYear,
        projectionEnd,
        totalBuilt,
        propiedad,
        alquiler,
        mixto,
        sinInfo,
        projectedPropiedad,
        projectedAlquiler,
        projectedMixto,
        projectedSinInfo,
      }) =>
        `Gráfico de áreas apiladas con la evolución del parque de vivienda protegida en España entre 1991 y ${projectionEnd}, desglosado por uso. En ${lastYear}, último año con datos reales, había ${totalBuilt} viviendas protegidas construidas: ${propiedad} en propiedad, ${alquiler} en alquiler, ${mixto} en propiedad o alquiler con opción a compra y ${sinInfo} sin información del uso. A partir de ${lastYear + 1} los valores son una proyección que estima ${projectedPropiedad} viviendas en propiedad, ${projectedAlquiler} en alquiler, ${projectedMixto} en propiedad o alquiler con opción a compra y ${projectedSinInfo} sin información del uso en ${projectionEnd}.`,
    },

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

    mainChart: {
      // Dimension filter
      filterLabel: 'Ver por:',
      filterLegend: 'Ver por',
      dimensions: [
        { value: 'protection', label: 'Protección' },
        { value: 'plan', label: 'Plan' },
        { value: 'promotor', label: 'Promoción' },
        { value: 'tenencia', label: 'Uso' },
      ],

      // Number boxes copy
      builtCaption: 'VPOs construidas',
      builtRangePrefix: 'entre 1991 y',
      builtYearLabel: 'en',

      // Interaction hint shown on the exploration step
      interactionNote: {
        desktop: 'Pasa por encima del gráfico para ver información en detalle',
        mobile: 'Toca el gráfico para ver información en detalle',
      },

      // Display labels for the stacked areas (legend, tooltip, number boxes).
      // Keys mirror the stack order in steps.svelte.
      areaLabels: {
        permanent: 'Protección permanente',
        protected: 'Protección temporal',
        maybe: 'Descalificación voluntaria',
        lost: 'Perdidas',
        estatal: 'Plan estatal',
        autonomico: 'Plan autonómico',
        publico: 'Pública',
        privado: 'Privada',
        autopromotor: 'Autopromoción',
        sinAnimoLucro: 'Sin ánimo de lucro',
        propiedad: 'Propiedad',
        alquiler: 'Alquiler',
        mixto: 'Propiedad o alquiler con opción a compra',
        sinInfo: 'Sin información',
      },
      projectionSuffix: ' (proyección)',

      // Screen-reader caption + table columns, keyed by dimension
      a11y: {
        columns: {
          step0: ['Año', 'Construidas ese año', 'Acumulado'],
          protection: [
            'Año',
            'Construidas',
            'Protección permanente',
            'Protección temporal',
            'Descalificación voluntaria',
            'Perdidas',
          ],
          plan: [
            'Año',
            'Construidas',
            'Plan estatal',
            'Plan autonómico',
            'Sin información',
            'Perdidas',
          ],
          promotor: [
            'Año',
            'Construidas',
            'Pública',
            'Privada',
            'Autopromoción',
            'Sin ánimo de lucro',
            'Sin información',
            'Perdidas',
          ],
          tenencia: [
            'Año',
            'Construidas',
            'Propiedad',
            'Alquiler',
            'Propiedad o alquiler con opción a compra',
            'Sin información',
            'Perdidas',
          ],
        },
      },
    },

    // Accessibility texts (non-chart-specific)
    a11y: {
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
  formatDecimals = $derived(formatDecimals[this.value] ?? formatDecimals['es']);
  formatIntegers = $derived(formatIntegers[this.value] ?? formatIntegers['es']);
}
export const vizLang = new Lang();
