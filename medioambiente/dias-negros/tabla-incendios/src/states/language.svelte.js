import { formatDecimals, formatIntegers } from '../utils/locale';

// Comes from https://observablehq.com/@civio/automatizar-traducciones-visualizaciones
const texts = {
	es: {
		title: 'Días con más incendios entre 1992 y 2022',

		// Territorial level selector, same keys as the level values
		levelLegend: 'Nivel territorial',
		levels: {
			comunidad: 'Comunidades',
			provincia: 'Provincias',
		},

		source: `Fuente: Estadística General de Incendios Forestales (EGIF) y elaboración propia.`,
		methodology: 'Para saber más, consulta nuestra ',
		methodologyLink: 'metodología',
		note: '* Se excluye Ceuta porque ningún día hay más de un incendio activo.<br /> ** Faltan los datos de Navarra y Cantabria en 2022 porque no están consolidados.',

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

		// Fires table texts
		table: {
			rank: 'Puesto',
			community: 'Comunidad',
			province: 'Provincia',
			fires: 'Incendios activos',
			date: 'Fecha',
			year: 'Año',
			month: 'Mes',
			allCommunities: 'Todas',
			allProvinces: 'Todas',
			allYears: 'Todos',
			allMonths: 'Todos',
			previousPage: 'Anterior',
			nextPage: 'Siguiente',
			page: 'Página',
			noResults: 'No hay días que coincidan con los filtros seleccionados.',
			clearFilters: 'Limpiar filtros',
			filtersLabel: 'Filtros de la tabla',
			paginationLabel: 'Paginación de la tabla',
			days: 'días',
			of: 'de',
		},

		// Chart descriptions for screen readers
		a11y: {
			mainChart: {
				description:
					'Tabla clasificatoria de los días con más incendios forestales activos a la vez en cada comunidad o provincia, entre 1992 y 2022. Galicia y Asturias copan los primeros puestos: a nivel de provincia encabeza la lista A Coruña, con 199 incendios activos el 30 de agosto de 1995. La tabla muestra puesto, territorio, número de incendios y fecha; se puede agrupar por comunidades o por provincias, filtrar por comunidad, provincia, año y mes, y está paginada de 10 en 10 días.',
				// No `columns`/`items`: the visualization is a native HTML table,
				// already accessible on its own, so only the summary is needed
			},
			followingList: 'A continuación tienes el listado con todos los detalles.',
			followingTable: 'A continuación tienes la tabla con todos los detalles.',
		},
	}
};

class Lang {
	value = $state('es');

	setLang(lang) {
		this.value = texts[lang] ? lang : 'es';
	}

	texts = $derived(texts[this.value]);
	formatDecimals = $derived(formatDecimals[this.value] ?? formatDecimals['es']);
	formatIntegers = $derived(formatIntegers[this.value] ?? formatIntegers['es']);

	formatFullDate = $derived(
		new Intl.DateTimeFormat(this.value, {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC',
		})
	);

	// Localized month names, indexed 0-11 like Date#getMonth()
	monthNames = $derived.by(() => {
		const formatMonth = new Intl.DateTimeFormat(this.value, { month: 'long', timeZone: 'UTC' });
		return Array.from({ length: 12 }, (_, month) =>
			formatMonth.format(new Date(Date.UTC(2000, month, 1)))
		);
	});
}
export const vizLang = new Lang();
