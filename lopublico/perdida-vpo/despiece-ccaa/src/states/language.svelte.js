import { formatDecimals, formatIntegers } from '../utils/locale';
import { ccaaDisplayNames, ccaasWithArticle } from './ccaaCatalog';

// Comes from https://observablehq.com/@civio/automatizar-traducciones-visualizaciones
const texts = {
  es: {
    // Sources per chart type × scope.
    // Each chart passes the right key to Footer.
    sources: {
      ccaaChart:
        "Fuente: <a href='https://www.mivau.gob.es/el-ministerio/observatorios-y-estadisticas/estadisticas/vivienda-rehabilitacion-protegidas' target='_blank'>Estadísticas de rehabilitación y vivienda protegida</a> del Ministerio de Vivienda y Agenda Urbana y datos aportados por las comunidades autonómicas a Civio a través de la Ley de Transparencia",
      plazosChartCcaa:
        'Fuente: Normativas aprobadas por la comunidad autónoma. Los detalles y enlaces a cada una de ellas están disponibles en la visualización',
    },
    methodology: 'Para saber más, consulta nuestra ',
    methodologyLink: 'metodología',
    noteLabel: 'Nota:',

    // Share/embed texts
    embedViz: 'Incrustar',
    copiedCode: 'Copiado',

    // Accessibility texts
    shareButton: 'Compartir visualización',
    closeShare: 'Cerrar opciones de compartir',
    copyEmbed: 'Copiar código para incrustar',
    codeCopied: 'Código copiado al portapapeles',
    opensInNewWindow: '(abre en nueva ventana)',
    logoAlt: 'logo Civio',
    dataListTitle: 'Listado completo de datos',

    ccaaChart: {
      // Loading / error / empty states
      loading: 'Cargando…',
      error: (msg) => `Error: ${msg}`,
      noData: (ccaa) => `Sin datos para ${ccaa}.`,

      // Visible chart title
      title: (ccaa) => `Viviendas protegidas en ${ccaa}`,

      // Dimension filter
      filterLabel: 'Ver por:',
      filterAriaLegend: 'Ver datos por',
      dimensions: [
        { value: 'protection', label: 'Protección' },
        { value: 'plan', label: 'Plan' },
        { value: 'promotor', label: 'Promoción' },
        { value: 'tenencia', label: 'Uso' },
      ],

      // Hover/touch hint under the number boxes
      hoverHint: (isMobile) =>
        `${isMobile ? 'Toca el' : 'Pasa por encima del'} gráfico para ver información en detalle año a año.`,

      // Per-CCAA editorial notes shown above the chart's source footer.
      notes: {
        cataluna:
          'Según los datos facilitados por la Generalitat de Catalunya, su parque de vivienda protegida se situó en 90.523 viviendas a finales del pasado año. El gráfico muestra una cifra muy alta de viviendas que podrían haber sido descalificadas anticipadamente, sin concretar cuántas de ellas siguen en vigor, porque los datos facilitados no incluyen los años de descalificación de las viviendas que han salido al mercado de forma anticipada.',
      },

      // Number boxes copy
      builtCaption: 'VPOs construidas',
      builtRangePrefix: 'entre 1991 y',

      // Display labels for the stacked areas (legend, tooltip, number boxes).
      // Keys mirror the stack order in chartConfig.
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

      // Screen-reader descriptions + table columns, keyed by dimension
      a11y: {
        // Caption for the sr-only data table (longer/more descriptive than the visible h4)
        title: (ccaa) => `Evolución del parque de vivienda protegida en ${ccaa}`,
        // Per-view category labels used by mainChart.js to build the breakdown
        // sentence; zero-valued segments are filtered out to reduce SR noise.
        breakdownLabels: {
          protection: {
            permanent: 'de forma permanente',
            protected: 'con protección temporal',
            maybe: 'con posibilidad de descalificación voluntaria',
          },
          plan: {
            estatal: 'provienen de planes estatales',
            autonomico: 'de planes autonómicos',
            sinInfo: 'sin información del plan',
          },
          promotor: {
            publico: 'de promoción pública',
            privado: 'de promoción privada',
            autopromotor: 'de autopromoción',
            sinAnimoLucro: 'de entidades sin ánimo de lucro',
            sinInfo: 'sin información de la promoción',
          },
          tenencia: {
            propiedad: 'en propiedad',
            alquiler: 'en alquiler',
            mixto: 'en alquiler con opción a compra',
            sinInfo: 'sin información del uso',
          },
        },
        // Labels for the projection breakdown sentence. Where the wording
        // matches breakdownLabels exactly (promotor, tenencia) we reuse those
        // at the call site; protection and plan need different phrasing because
        // they follow "una proyección que estima…" instead of the parenthetical.
        projectionLabels: {
          protection: {
            permanent: 'con protección permanente',
            protected: 'con protección temporal',
            maybe: 'que pueden haber sido descalificadas voluntariamente de forma anticipada',
          },
          plan: {
            estatal: 'provenientes de planes estatales',
            autonomico: 'de planes autonómicos',
            sinInfo: 'sin información del plan',
          },
        },
        description: {
          protection: ({
            ccaa,
            totalBuilt,
            alive,
            breakdown,
            lost,
            lostPct,
            lastYear,
            projectedBreakdown,
            projectionEnd,
          }) =>
            `Gráfico de áreas apiladas con la evolución del parque de vivienda protegida en ${ccaa} entre 1991 y ${projectionEnd}, desglosado por estado de protección. En ${lastYear}, último año con datos reales, se habían construido ${totalBuilt} viviendas protegidas, de las cuales ${alive} seguían bajo algún tipo de protección${breakdown ? ` (${breakdown})` : ''}${lost ? ` y ${lost} ya la habían perdido (${lostPct} del total construido)` : ''}. A partir de ${lastYear + 1} los valores son una proyección que estima ${projectedBreakdown} en ${projectionEnd}.`,
          plan: ({
            ccaa,
            totalBuilt,
            alive,
            breakdown,
            lastYear,
            projectedBreakdown,
            projectionEnd,
          }) =>
            `Gráfico de áreas apiladas con la evolución del parque de vivienda protegida en ${ccaa} entre 1991 y ${projectionEnd}, desglosado por plan. En ${lastYear}, último año con datos reales, se habían construido ${totalBuilt} viviendas protegidas y ${alive} seguían bajo algún tipo de protección${breakdown ? `: ${breakdown}` : ''}. A partir de ${lastYear + 1} los valores son una proyección que estima ${projectedBreakdown} en ${projectionEnd}.`,
          promotor: ({
            ccaa,
            totalBuilt,
            alive,
            breakdown,
            lastYear,
            projectedBreakdown,
            projectionEnd,
          }) =>
            `Gráfico de áreas apiladas con la evolución del parque de vivienda protegida en ${ccaa} entre 1991 y ${projectionEnd}, desglosado por tipo de promoción. En ${lastYear}, último año con datos reales, se habían construido ${totalBuilt} viviendas protegidas y ${alive} seguían bajo algún tipo de protección${breakdown ? `: ${breakdown}` : ''}. A partir de ${lastYear + 1} los valores son una proyección que estima ${projectedBreakdown} en ${projectionEnd}.`,
          tenencia: ({
            ccaa,
            totalBuilt,
            alive,
            breakdown,
            lastYear,
            projectedBreakdown,
            projectionEnd,
          }) =>
            `Gráfico de áreas apiladas con la evolución del parque de vivienda protegida en ${ccaa} entre 1991 y ${projectionEnd}, desglosado por uso. En ${lastYear}, último año con datos reales, se habían construido ${totalBuilt} viviendas protegidas y ${alive} seguían bajo algún tipo de protección${breakdown ? `: ${breakdown}` : ''}. A partir de ${lastYear + 1} los valores son una proyección que estima ${projectedBreakdown} en ${projectionEnd}.`,
        },
        columns: {
          protection: [
            'Año',
            'Construidas',
            'Permanentes',
            'Temporales',
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
            'Alquiler con opción a compra',
            'Sin información',
            'Perdidas',
          ],
        },
      },
    },

    // CCAA selector hints
    selector: {
      label: 'Comunidad autónoma',
      hintIp: 'Te mostramos información en detalle sobre tu región ',
      hintDefault: 'Selecciona aquí la información en detalle sobre cualquier comunidad ',
      showingYours: 'Selecciona otra',
      pickOne: 'Selecciona una comunidad o',
      navigate: 'navega',
      swipingOr: 'deslizando o',
      usingArrows: 'usando las flechas',
    },

    // PlazosChart texts
    plazosChart: {
      titleEstatal: 'Plazos de protección y normativa de las VPOs con financiación estatal',
      titleCcaa: (ccaa) => `Plazos de protección y normativa de las VPOs en ${ccaa}`,
      housingTypesLabel: 'Tipos de vivienda',
      lawsLabel: 'Legislación',
      hoverHint: (isMobile) =>
        `${isMobile ? 'Toca' : 'Pasa por encima de'} cada tipo de vivienda y legislación para ver información en detalle`,
      legend: {
        yearsTitle: 'Años de protección',
        permanent: 'Permanente',
        // howToRead: 'Cómo leer',
        howToReadAria:
          'Cómo leer: con opacidad plena marca el plazo vigente, atenuado el plazo histórico',
        historic: 'histórico',
        current: 'VIGENTE',
      },
      tooltip: {
        since: (year) => `Desde ${year}`,
        protectionPermanent: { prefix: 'Protección', bold: 'permanente' },
        protectionYears: (n) => ({ prefix: 'Protección durante', bold: `${n} años` }),
        protectionRange: (min, max) => ({
          prefix: 'Protección entre',
          bold: `${min} y ${max} años`,
        }),
        viewSource: 'Ver fuente',
        viewSources: 'Ver fuentes:',
        sourceLabel: (n) => `Fuente ${n}`,
      },
    },

    // Navigation
    nav: {
      prevCcaa: 'Comunidad anterior',
      nextCcaa: 'Siguiente comunidad',
      scrollUp: 'Volver arriba',
      pickOtherCcaa: 'Selecciona otra comunidad',
    },

    // Accessibility texts (non-chart-specific)
    a11y: {
      plazosChart: {
        description: ({
          ccaa,
          firstYear,
          lastYear,
          periodsCount,
          currentTypesText,
          lawsCount,
          categoriesCount,
        }) =>
          `Línea de tiempo con la evolución histórica de los plazos de protección y la normativa de las VPO en ${ccaa} entre ${firstYear} y ${lastYear}. Se distinguen ${periodsCount} periodos de regulación. En ${lastYear}, los tipos vigentes son: ${currentTypesText}.`,
        periodsTitle: (ccaa) => `Plazos de protección por periodo y tipo de vivienda en ${ccaa}`,
        periodsColumns: ['Periodo', 'Tipo de vivienda', 'Plazo de protección', 'Notas'],
        lawsDescription: ({ ccaa, lawsCount, categoriesCount }) =>
          `Bajo la evolución temporal de tipos de vivienda, se completa la línea del tiempo con la evolución histórica de la legislación regional. En ${ccaa} tenemos ${lawsCount} normas y planes asociados a las VPO.`,
        lawsTitle: (ccaa) => `Normativa asociada a las VPO en ${ccaa}`,
        lawsColumns: ['Norma', 'Descripción', 'Categoría', 'Vigencia', 'Fuentes'],
        noCurrent: 'sin tipos vigentes',
      },
      followingList: 'A continuación tienes el listado con todos los detalles.',
      followingTable: 'A continuación tienes la tabla con todos los detalles.',
    },

    // Display names keyed by the same ids the chart uses (ccaaCatalog ids).
    ccaas: ccaaDisplayNames,
    // Misma tabla pero con "la" delante para las CCAAs que lo requieren
    // tras preposición (Madrid, Valencia, Murcia). Usar en títulos.
    ccaasWithArticle,
  },
  ga: {
    // Sources per chart type × scope.
    // Each chart passes the right key to Footer.
    sources: {
      ccaaChart:
        "Fonte: <a href='https://www.mivau.gob.es/el-ministerio/observatorios-y-estadisticas/estadisticas/vivienda-rehabilitacion-protegidas' target='_blank'>Estatísticas de rehabilitación e vivenda protexida</a> do Ministerio de Vivenda e Axenda Urbana e datos achegados polas comunidades autónomas a Civio a través da Lei de Transparencia",
      plazosChartCcaa:
        'Fonte: Normativas aprobadas pola comunidade autónoma. Os detalles e ligazóns a cada unha delas están dispoñibles na visualización',
    },
    methodology: 'Para saber máis, consulta a nosa ',
    methodologyLink: 'metodoloxía',

    // Share/embed texts
    embedViz: 'Inserir',
    copiedCode: 'Copiado',

    // Accessibility texts
    shareButton: 'Compartir visualización',
    closeShare: 'Pechar opcións de compartir',
    copyEmbed: 'Copiar código para inserir',
    codeCopied: 'Código copiado ao portapapeis',
    opensInNewWindow: '(abre en nova xanela)',
    logoAlt: 'logo Civio',
    dataListTitle: 'Listado completo de datos',

    ccaaChart: {
      // Loading / error / empty states
      loading: 'Cargando…',
      error: (msg) => `Error: ${msg}`,
      noData: (ccaa) => `Sen datos para ${ccaa}.`,

      // Visible chart title
      title: (ccaa) => `Vivendas protexidas en ${ccaa}`,

      // Dimension filter
      filterLabel: 'Ver por:',
      filterAriaLegend: 'Ver datos por',
      dimensions: [
        { value: 'protection', label: 'Protección' },
        { value: 'plan', label: 'Plan' },
        { value: 'promotor', label: 'Promoción' },
        { value: 'tenencia', label: 'Uso' },
      ],

      // Hover/touch hint under the number boxes
      hoverHint: (isMobile) =>
        `${isMobile ? 'Toca o' : 'Pasa por riba do'} gráfico para veres información en detalle ano por ano.`,

      // Number boxes copy
      builtCaption: 'VPOs construídas',
      builtRangePrefix: 'entre 1991 e',

      // Display labels for the stacked areas (legend, tooltip, number boxes).
      // Keys mirror the stack order in chartConfig.
      areaLabels: {
        permanent: 'Protección permanente',
        protected: 'Protección temporal',
        maybe: 'Descualificación voluntaria',
        lost: 'Perdas',
        estatal: 'Plan estatal',
        autonomico: 'Plan autonómico',
        publico: 'Pública',
        privado: 'Privada',
        autopromotor: 'Autopromoción',
        sinAnimoLucro: 'Sen ánimo de lucro',
        propiedad: 'Propiedade',
        alquiler: 'Alugueiro',
        mixto: 'Propiedade ou alugueiro con opción a compra',
        sinInfo: 'Sen información',
      },
      projectionSuffix: ' (proxección)',

      // Screen-reader descriptions + table columns, keyed by dimension
      a11y: {
        // Caption for the sr-only data table (longer/more descriptive than the visible h4)
        title: (ccaa) => `Evolución do parque de vivenda protexida en ${ccaa}`,
        // Per-view category labels used by mainChart.js to build the breakdown
        // sentence; zero-valued segments are filtered out to reduce SR noise.
        breakdownLabels: {
          protection: {
            permanent: 'de forma permanente',
            protected: 'con protección temporal',
            maybe: 'con posibilidade de descualificación voluntaria',
          },
          plan: {
            estatal: 'proveñen de plans estatais',
            autonomico: 'de plans autonómicos',
            sinInfo: 'sen información do plan',
          },
          promotor: {
            publico: 'de promoción pública',
            privado: 'de promoción privada',
            autopromotor: 'de autopromoción',
            sinAnimoLucro: 'de entidades sen ánimo de lucro',
            sinInfo: 'sen información da promoción',
          },
          tenencia: {
            propiedad: 'en propiedade',
            alquiler: 'en alugueiro',
            mixto: 'en alugueiro con opción a compra',
            sinInfo: 'sen información do uso',
          },
        },
        // Labels for the projection breakdown sentence. Where the wording
        // matches breakdownLabels exactly (promotor, tenencia) we reuse those
        // at the call site; protection and plan need different phrasing because
        // they follow "una proyección que estima…" instead of the parenthetical.
        projectionLabels: {
          protection: {
            permanent: 'con protección permanente',
            protected: 'con protección temporal',
            maybe: 'que puideron ser descualificadas voluntariamente de forma anticipada',
          },
          plan: {
            estatal: 'provenientes de plans estatais',
            autonomico: 'de plans autonómicos',
            sinInfo: 'sen información do plan',
          },
        },
        // En 'ga' no se usa (esto es solo para periodistas, para meter descripciones alt en RRSS)
        description: {
          protection: ({
            ccaa,
            totalBuilt,
            alive,
            breakdown,
            lost,
            lostPct,
            lastYear,
            projectedBreakdown,
            projectionEnd,
          }) =>
            `Gráfico de áreas apiladas con la evolución del parque de vivienda protegida en ${ccaa} entre 1991 y ${projectionEnd}, desglosado por estado de protección. En ${lastYear}, último año con datos reales, se habían construido ${totalBuilt} viviendas protegidas, de las cuales ${alive} seguían bajo algún tipo de protección${breakdown ? ` (${breakdown})` : ''}${lost ? ` y ${lost} ya la habían perdido (${lostPct} del total construido)` : ''}. A partir de ${lastYear + 1} los valores son una proyección que estima ${projectedBreakdown} en ${projectionEnd}.`,
          plan: ({
            ccaa,
            totalBuilt,
            alive,
            breakdown,
            lastYear,
            projectedBreakdown,
            projectionEnd,
          }) =>
            `Gráfico de áreas apiladas con la evolución del parque de vivienda protegida en ${ccaa} entre 1991 y ${projectionEnd}, desglosado por plan. En ${lastYear}, último año con datos reales, se habían construido ${totalBuilt} viviendas protegidas y ${alive} seguían bajo algún tipo de protección${breakdown ? `: ${breakdown}` : ''}. A partir de ${lastYear + 1} los valores son una proyección que estima ${projectedBreakdown} en ${projectionEnd}.`,
          promotor: ({
            ccaa,
            totalBuilt,
            alive,
            breakdown,
            lastYear,
            projectedBreakdown,
            projectionEnd,
          }) =>
            `Gráfico de áreas apiladas con la evolución del parque de vivienda protegida en ${ccaa} entre 1991 y ${projectionEnd}, desglosado por tipo de promoción. En ${lastYear}, último año con datos reales, se habían construido ${totalBuilt} viviendas protegidas y ${alive} seguían bajo algún tipo de protección${breakdown ? `: ${breakdown}` : ''}. A partir de ${lastYear + 1} los valores son una proyección que estima ${projectedBreakdown} en ${projectionEnd}.`,
          tenencia: ({
            ccaa,
            totalBuilt,
            alive,
            breakdown,
            lastYear,
            projectedBreakdown,
            projectionEnd,
          }) =>
            `Gráfico de áreas apiladas con la evolución del parque de vivienda protegida en ${ccaa} entre 1991 y ${projectionEnd}, desglosado por uso. En ${lastYear}, último año con datos reales, se habían construido ${totalBuilt} viviendas protegidas y ${alive} seguían bajo algún tipo de protección${breakdown ? `: ${breakdown}` : ''}. A partir de ${lastYear + 1} los valores son una proyección que estima ${projectedBreakdown} en ${projectionEnd}.`,
        },
        columns: {
          protection: [
            'Ano',
            'Construídas',
            'Permanentes',
            'Temporais',
            'Descualificación voluntaria',
            'Perdas',
          ],
          plan: [
            'Ano',
            'Construídas',
            'Plan estatal',
            'Plan autonómico',
            'Sen información',
            'Perdas',
          ],
          promotor: [
            'Ano',
            'Construídas',
            'Pública',
            'Privada',
            'Autopromoción',
            'Sen ánimo de lucro',
            'Sen información',
            'Perdas',
          ],
          tenencia: [
            'Ano',
            'Construídas',
            'Propiedade',
            'Alugueiro',
            'Alugueiro con opción a compra',
            'Sen información',
            'Perdas',
          ],
        },
      },
    },

    // CCAA selector hints
    // En ga no se usa
    selector: {
      label: 'Comunidad autónoma',
      hintIp: 'Te mostramos información en detalle sobre tu región ',
      hintDefault: 'Selecciona aquí la información en detalle sobre cualquier comunidad ',
      showingYours: 'Selecciona otra',
      pickOne: 'Selecciona una comunidad o',
      navigate: 'navega',
      swipingOr: 'deslizando o',
      usingArrows: 'usando las flechas',
    },

    // PlazosChart texts
    plazosChart: {
      // En ga no se usa se titleEstatal
      titleEstatal: 'Plazos de protección y normativa de las VPOs con financiación estatal',
      titleCcaa: (ccaa) => `Prazos de protección e normativa das VPOs en ${ccaa}`,
      housingTypesLabel: 'Tipos de vivenda',
      lawsLabel: 'Lexislación',
      hoverHint: (isMobile) =>
        `${isMobile ? 'Toca' : 'Pasa por riba de'} cada tipo de vivenda e lexislación para veres información en detalle`,
      legend: {
        yearsTitle: 'Anos de protección',
        permanent: 'Permanente',
        // howToRead: 'Cómo leer',
        howToReadAria:
          'Como ler: con opacidade plena marca o prazo vixente, atenuado o prazo histórico',
        historic: 'histórico',
        current: 'VIXENTE',
      },
      tooltip: {
        since: (year) => `Desde ${year}`,
        protectionPermanent: { prefix: 'Protección', bold: 'permanente' },
        protectionYears: (n) => ({ prefix: 'Protección durante', bold: `${n} anos` }),
        protectionRange: (min, max) => ({
          prefix: 'Protección entre',
          bold: `${min} e ${max} anos`,
        }),
        viewSource: 'Ver fonte',
        viewSources: 'Ver fontes:',
        sourceLabel: (n) => `Fonte ${n}`,
      },
    },

    // Navigation
    // En ga no se usa
    nav: {
      prevCcaa: 'Comunidad anterior',
      nextCcaa: 'Siguiente comunidad',
      scrollUp: 'Volver arriba',
      pickOtherCcaa: 'Selecciona otra comunidad',
    },

    // Accessibility texts (non-chart-specific)
    a11y: {
      plazosChart: {
        description: ({
          ccaa,
          firstYear,
          lastYear,
          periodsCount,
          currentTypesText,
          lawsCount,
          categoriesCount,
        }) =>
          `Liña de tempo coa evolución histórica dos prazos de protección e a normativa das VPO en ${ccaa} entre ${firstYear} e ${lastYear}. Distínguense ${periodsCount} períodos de regulación. En ${lastYear}, os tipos vixentes son: ${currentTypesText}.`,
        periodsTitle: (ccaa) => `Prazos de protección por período e tipo de vivenda en ${ccaa}`,
        periodsColumns: ['Período', 'Tipo de vivenda', 'Prazo de protección', 'Notas'],
        lawsDescription: ({ ccaa, lawsCount, categoriesCount }) =>
          `Baixo a evolución temporal de tipos de vivenda, complétase a liña de tempo coa evolución histórica da lexislación autonómica. En ${ccaa} temos ${lawsCount} normas e plans asociados ás VPO.`,
        lawsTitle: (ccaa) => `Normativa asociada ás VPO en ${ccaa}`,
        lawsColumns: ['Norma', 'Descrición', 'Categoría', 'Vixencia', 'Fontes'],
        noCurrent: 'sen tipos vixentes',
      },
      followingList: 'A continuación tes o listado con todos os detalles.',
      followingTable: 'A continuación tes a táboa con todos os detalles.',
    },

    // Display names keyed by the same ids the chart uses (ccaaCatalog ids).
    // En gallego solo se sobrescribe Galicia → Galiza; el resto se conserva
    // en español porque la viz solo se va a embeber para Galicia.
    ccaas: { ...ccaaDisplayNames, galicia: 'Galiza' },
    // Misma tabla pero con "la" delante para las CCAAs que lo requieren
    // tras preposición (Madrid, Valencia, Murcia). Usar en títulos.
    ccaasWithArticle: { ...ccaasWithArticle, galicia: 'Galiza' },

    // Per-CCAA translation of housing-type labels that come literally from the
    // CSV (sub.label in plazosData). Looked up as
    // `vizLang.texts.housingTypes?.[ccaa]?.[label] ?? label` so any CCAA or
    // label not listed falls back to the original CSV string.
    housingTypes: {
      galicia: {
        'En suelo de desarrollo público': 'En solo de desenvolvemento público',
        Alquiler: 'Alugueiro',
        'Venta de promoción privada en suelo no desarrollado por la administración pública':
          'Venda de promoción privada en solo non desenvolvido pola administración pública',
        'Alquiler en suelo privado': 'Alugueiro en solo privado',
        'Promoción privada en ámbito territorial de precio máximo superior':
          'Promoción privada en ámbito territorial de prezo máximo superior',
        'Promoción privada en zona territorial primera':
          'Promoción privada en zona territorial primeira',
        'Promoción privada en zona territorial segunda':
          'Promoción privada en zona territorial segunda',
        'Promoción pública en suelo destinado a VPO': 'Promoción pública en solo destinado a VPO',
        Resto: 'Resto',
      },
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
