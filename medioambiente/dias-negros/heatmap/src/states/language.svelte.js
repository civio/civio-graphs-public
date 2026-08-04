import { formatDecimals, formatIntegers } from '../utils/locale';

// Comes from https://observablehq.com/@civio/automatizar-traducciones-visualizaciones
const texts = {
	es: {
		title: 'Incendios activos cada día entre 1992 y 2022',

		// Territorial level selector: keys match the `level` values
		// (comunidad | provincia) in data.svelte.js
		levelLegend: 'Nivel territorial',
		levels: {
			comunidad: 'Comunidades',
			provincia: 'Provincias',
		},
		regionLabel: {
			comunidad: 'Selecciona una comunidad:',
			provincia: 'Selecciona una provincia:',
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
		previousYear: 'Año anterior',
		nextYear: 'Año siguiente',
		copyEmbed: 'Copiar código para incrustar',
		codeCopied: 'Código copiado al portapapeles',
		loadingEmbed: 'Cargando código…',
		embedError: 'Error al copiar el código',
		opensInNewWindow: '(abre en nueva ventana)',
		logoAlt: 'logo Civio',
		dataListTitle: 'Listado completo de datos',

		// Chart descriptions for screen readers. `{placeholders}` are filled in
		// with data by the generators in src/a11y/.
		a11y: {
			mainChart: {
				description:
					'Mapa de calor que muestra el número de incendios forestales activos cada día del año (eje horizontal, de enero a diciembre) para cada año (eje vertical) en {region}. Cuanto más oscuro es el color, más incendios activos hubo ese día.',
				worstDaySingle: 'El peor día fue el {date}, con {fires}.',
				worstDayTie: 'Hubo {count} días con {fires}, el máximo registrado: {dates}.',
				severeDaysNote: 'Además, hubo {days} con más de {threshold} incendios activos.',
				title: 'Resumen por año de los incendios activos en {region}',
				columns: ['Año', 'Peor día', 'Días con más de {threshold} incendios'],
				// Table cells generated per year in a11y/mainChart.js
				worstDayCell: '{dates}, con {fires}',
				worstDayCellTie: '{days} con {fires}',
				noSevereDaysCell: 'Ninguno',
			},
			dayByDay: {
				summary: 'Consultar el número de incendios activos día a día en {region}',
				yearLabel: '{year}: {days} con incendios activos',
				dayItem: '{date}: {fires}',
			},
			regionStatus: 'Mostrando datos de {region}',
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
	formatDecimals = $derived(formatDecimals[this.value] ?? formatDecimals['es']);
	formatIntegers = $derived(formatIntegers[this.value] ?? formatIntegers['es']);

	// Date formatters in the active language. UTC so the day never shifts:
	// the dataset's dates are UTC midnights.
	formatFullDate = $derived(
		new Intl.DateTimeFormat(this.value, {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC',
		})
	);
	formatDayMonth = $derived(
		new Intl.DateTimeFormat(this.value, { day: 'numeric', month: 'long', timeZone: 'UTC' })
	);
	formatDayMonthShort = $derived(
		new Intl.DateTimeFormat(this.value, { day: 'numeric', month: 'short', timeZone: 'UTC' })
	);
	formatMonthShort = $derived(
		new Intl.DateTimeFormat(this.value, { month: 'short', timeZone: 'UTC' })
	);
	// "a, b y c" date enumerations in the a11y descriptions
	formatList = $derived(new Intl.ListFormat(this.value, { style: 'long', type: 'conjunction' }));
}
export const vizLang = new Lang();
