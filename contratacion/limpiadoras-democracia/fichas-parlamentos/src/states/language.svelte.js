import { formatDecimals, formatHours } from '../utils/locale';

// Comes from https://observablehq.com/@civio/automatizar-traducciones-visualizaciones
const texts = {
  es: {
    // Accessible label for the embedded widget
    widgetLabel: 'Limpieza en los parlamentos, parlamento a parlamento',

    // Data loading states
    loading: 'Cargando datos…',
    loadError: 'No se han podido cargar los datos',

    // Display name of each parliament, keyed by its id (see states/data.svelte.js).
    // Names are an editorial choice, so they live here and not in the dataset.
    regionNames: {
      andalucia: 'Andalucía',
      aragon: 'Aragón',
      asturias: 'Principado de Asturias',
      baleares: 'Islas Baleares',
      canarias: 'Canarias',
      cantabria: 'Cantabria',
      castillalamancha: 'Castilla-La Mancha',
      castillayleon: 'Castilla y León',
      cataluna: 'Cataluña',
      comunitatvalenciana: 'Comunidad Valenciana',
      extremadura: 'Extremadura',
      galicia: 'Galicia',
      larioja: 'La Rioja',
      madrid: 'Comunidad de Madrid',
      murcia: 'Región de Murcia',
      navarra: 'Comunidad Foral de Navarra',
      paisvasco: 'País Vasco',
      congreso: 'Congreso de los Diputados',
      senado: 'Senado de España',
    },

    // Parliament card labels and units
    card: {
      lastContract: 'Contrato en vigor desde',
      salary: 'Salario bruto (*)',
      // Per-card link to the collective agreement the salary comes from
      agreementLink: 'Ver convenio',
      // Starts with the visible text, so voice control ("click Ver convenio") works
      agreementLinkLabel: 'Ver convenio colectivo de',
      salaryUnit: '€/mes',
      referenceLabel: 'SMI',
      // Shown instead of the salary meter when the agreement salary is below the SMI
      belowMinimumWage: (smi) =>
        `Las trabajadoras cobran un complemento para alcanzar los ${smi} € del SMI`,
      weeklyHours: 'Jornada laboral completa',
      weeklyHoursUnit: 'h/semana',
      // Under the hours where they are estimated from the agreement's annual
      // hours (`annualHours`, already formatted; null until it's in the data)
      estimatedHours: (annual) =>
        annual
          ? `Estimación a partir de las ${annual} h/año del convenio`
          : 'Estimación a partir de la jornada anual del convenio',
      noData: '—',
    },

    // Parliament card selector and navigation
    selector: {
      label: 'Selecciona una comunidad',
      pickOne: 'Selecciona una comunidad o',
      navigate: 'navega',
      swipingOr: 'deslizando o',
      usingArrows: 'usando las flechas',
    },
    nav: {
      prevRegion: 'Comunidad anterior',
      nextRegion: 'Siguiente comunidad',
    },

    source: {
      regions: `Fuente: Licitaciones y convenios provinciales (autonómico en el caso de Cataluña) de limpieza de edificios.`,
      congreso: `Fuente: Convenio colectivo de limpieza de edificios y locales de la Comunidad de Madrid (2026-2028).`,
      senado: `Fuente: Convenio colectivo de limpieza de edificios y locales de la Comunidad de Madrid (2026-2028).`,
    },
    methodology: 'Para saber más, consulta nuestra ',
    methodologyLink: 'metodología',

    notes: {
      label: 'Notas:',
      // Region name as it reads after "en" in the notes, for those that take an
      // article ("en la Comunidad de Madrid"); the rest use regionNames.
      namesAfterEn: {
        asturias: 'el Principado de Asturias',
        baleares: 'las Islas Baleares',
        comunitatvalenciana: 'la Comunidad Valenciana',
        madrid: 'la Comunidad de Madrid',
        murcia: 'la Región de Murcia',
        navarra: 'la Comunidad Foral de Navarra',
        paisvasco: 'el País Vasco',
      },
      // Built from the data (agreementYear, agreementStatus), so it follows the
      // Excel: `published` is the table year of the up-to-date agreements (null
      // if the view has none) and `pending` the parliaments still on older
      // tables, grouped by status. See Footer.svelte.
      salary({ published, pending }) {
        // Singular or plural, depending on how many parliaments share the status
        const status = {
          sin_publicar: (n) =>
            n > 1
              ? 'convenios de 2026 aprobados pero aún sin publicar'
              : 'convenio de 2026 aprobado pero aún sin publicar',
          sin_negociar: (n) =>
            n > 1 ? 'convenios de 2026 aún sin negociar' : 'convenio de 2026 aún sin negociar',
        };
        const list = new Intl.ListFormat('es', { type: 'conjunction' });
        const base =
          '(*) Salario base bruto mensual para jornada completa según convenio, en 12 meses con las pagas extra prorrateadas.';
        // A single chamber with older tables: no names, just its year and why
        if (published == null) {
          const [{ year, status: s }] = pending;
          return `${base} Tablas salariales de ${year} (${status[s](1)}).`;
        }
        if (!pending.length) return `${base} Tablas salariales de ${published}.`;
        const exceptions = pending.map(({ parliaments, status: s }) => {
          const names = parliaments.map((p) => this.namesAfterEn[p.id] ?? p.name);
          return `en ${list.format(names)} (${status[s](parliaments.length)})`;
        });
        const years = list.format([...new Set(pending.map((g) => String(g.year)))]);
        return `${base} Tablas salariales de ${published}, salvo ${list.format(exceptions)}, donde se usan las de ${years}.`;
      },
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
  },

  gl: {
    // Accessible label for the embedded widget
    widgetLabel: 'Limpieza en los parlamentos, parlamento a parlamento',

    // Data loading states
    loading: 'Cargando datos…',
    loadError: 'No se han podido cargar los datos',

    // Display name of each parliament, keyed by its id (see states/data.svelte.js).
    // Names are an editorial choice, so they live here and not in the dataset.
    regionNames: {
      andalucia: 'Andalucía',
      aragon: 'Aragón',
      asturias: 'Principado de Asturias',
      baleares: 'Islas Baleares',
      canarias: 'Canarias',
      cantabria: 'Cantabria',
      castillalamancha: 'Castilla-La Mancha',
      castillayleon: 'Castilla y León',
      cataluna: 'Cataluña',
      comunitatvalenciana: 'Comunidad Valenciana',
      extremadura: 'Extremadura',
      galicia: 'Galicia',
      larioja: 'La Rioja',
      madrid: 'Comunidad de Madrid',
      murcia: 'Región de Murcia',
      navarra: 'Comunidad Foral de Navarra',
      paisvasco: 'País Vasco',
      congreso: 'Congreso de los Diputados',
      senado: 'Senado de España',
    },

    // Parliament card labels and units
    card: {
      lastContract: 'Contrato en vigor dende',
      // Hand-translated dates, by parliament id: the date comes as Spanish text
      // from the CSV ("Abril de 2025"). Update by hand if the CSV changes.
      lastContractById: {
        galicia: 'Abril do 2025',
      },
      salary: 'Salario bruto (*)',
      // Per-card link to the collective agreement the salary comes from
      agreementLink: 'Ver convenio',
      // Starts with the visible text, so voice control ("click Ver convenio") works
      agreementLinkLabel: 'Ver convenio colectivo de',
      salaryUnit: '€/mes',
      referenceLabel: 'SMI',
      // Shown instead of the salary meter when the agreement salary is below the SMI
      belowMinimumWage: (smi) =>
        `Las trabajadoras cobran un complemento para alcanzar los ${smi} € del SMI`,
      weeklyHours: 'Xornada laboral completa',
      weeklyHoursUnit: 'h/semana',
      // Under the hours where they are estimated from the agreement's annual
      // hours (`annualHours`, already formatted; null until it's in the data)
      estimatedHours: (annual) =>
        annual
          ? `Estimación a partir de las ${annual} h/año del convenio`
          : 'Estimación a partir de la jornada anual del convenio',
      noData: '—',
    },

    // Parliament card selector and navigation
    selector: {
      label: 'Selecciona una comunidad',
      pickOne: 'Selecciona una comunidad o',
      navigate: 'navega',
      swipingOr: 'deslizando o',
      usingArrows: 'usando las flechas',
    },
    nav: {
      prevRegion: 'Comunidad anterior',
      nextRegion: 'Siguiente comunidad',
    },

    source: {
      regions: `Fonte: Licitacións e convenios provinciais (autonómico no caso de Cataluña) de limpeza de edificios.`,
      congreso: `Fuente: Convenio colectivo de limpieza de edificios y locales de la Comunidad de Madrid (2026-2028).`,
      senado: `Fuente: Convenio colectivo de limpieza de edificios y locales de la Comunidad de Madrid (2026-2028).`,
    },
    methodology: 'Para saber máis, consulta a ',
    methodologyLink: 'metodoloxía da investigación de Civio',

    notes: {
      label: 'Notas:',
      // Galician is only used for a single-region embed (Galicia, for local
      // press), so the note covers one parliament: its table year and, if those
      // tables are old, why. Same arguments as the Spanish version.
      salary({ published, pending }) {
        const status = {
          sin_publicar: 'convenio do 2026 aprobado pero aínda sen publicar',
          sin_negociar: 'convenio do 2026 aínda sen negociar',
        };
        const base =
          '(*) Salario base bruto mensual para xornada completa segundo o convenio, en 12 meses coas pagas extra prorrateadas.';
        if (published != null) return `${base} Táboas salariais do ${published}.`;
        const [{ year, status: s }] = pending;
        return `${base} Táboas salariais do ${year} (${status[s]}).`;
      },
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
  },
};

class Lang {
  value = $state('es');

  setLang(lang) {
    this.value = texts[lang] ? lang : 'es';
  }

  texts = $derived(texts[this.value]);
  formatDecimals = $derived(formatDecimals[this.value] ?? formatDecimals['es']);
  formatHours = $derived(formatHours[this.value] ?? formatHours['es']);
}
export const vizLang = new Lang();
