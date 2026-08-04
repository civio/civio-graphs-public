import { scaleLinear, range, scaleSequential, piecewise, interpolateHcl, color } from 'd3';
import { data } from '../states/data.svelte';

// Set project area as chosen when creating the project. It will be use for our project colors & also for our main div class in App
const appArea = 'medioambiente';

// Civio colors
const civioColors = {
	main: {
		'civio-blue': '#002A6D',
		'civio-yellow': '#FFED6A',
		'civio-green': '#56FFA9',
		'civio-lightYellow': '#FFF5a6',
		'civio-lightGreen': '#DEFFEE',
	},
	project: {
		elboenuestrodecadadia: {
			primary: '#2078ff',
			secondary: '#52efff',
			light: '#DDFCFF',
		},
		justicia: {
			primary: '#875cc3',
			secondary: '#ed99fd',
			light: '#FBEBFF',
		},
		medioambiente: {
			primary: '#ffb114',
			secondary: '#ffe73a',
			light: '#FFFAD9',
		},
		sanidad: {
			primary: '#08a6bf',
			secondary: '#2eefbc',
			light: '#D6FCF2',
		},
		contratacion: {
			primary: '#ff7550',
			secondary: '#ffe73a',
			light: '#FFFAD9',
		},
		poder: {
			primary: '#18dfa1',
			secondary: '#e7ff61',
			light: '#FAFFE0',
		},
		transparencia: {
			primary: '#d3514a',
			secondary: '#ff8a66',
			light: '#FFE8E1',
		},
		lopublico: {
			primary: '#f74383',
			secondary: '#FEA2D4',
			light: '#ffecf6',
		},
	},
};

// Main Civio colors - always available
const mainColors = civioColors.main;
export const mainColorsCSS = Object.entries(mainColors)
	.map(([key, value]) => `--${key}: ${value}`)
	.join(';');

// Project area colors - only when area exists
const projectColors = civioColors.project[appArea] || {};
export const projectColorsCSS = Object.entries(projectColors)
	.map(([key, value]) => `--${key}: ${value}`)
	.join(';');

// Sometimes we need custom colors, we can add them here as objects and will be integrated as CSS variables as well
// const customColors = {
//     public: '#002A6D',
//     private: '#FFED6A',
// }
export const customColorsCSS = '';
// export const customColors = Object.entries(fo)
//   .map(([key, value]) => `--${key.toLowerCase()}: ${value}`)
//   .join(';');

// Our black & white color scale
const bwScale = scaleLinear().domain([0, 1000]).range(['white', 'black']);
export const bwScaleCSS = range(0, 1000, 10) // start, end, steps
	.map((d) => `--bw${d}: ${bwScale(d)}`)
	.join(';');

// Circle colors — built from the project's own brand colors (not a generic
// d3 scheme) so the heatmap reads as Civio's, and chosen so the palest stop
// (secondary yellow) still stands out against the heatmap's light background
// (--bw30, near white) instead of fading into it like a pale yellow would.
// `$derived` can't be exported directly from a module (derived_invalid_export),
// so the scale stays private and callers go through this function instead.
const circleColorScale = $derived(
	scaleSequential(
		piecewise(interpolateHcl, [
			projectColors.secondary, // #ffe73a — amarillo (mín)
			projectColors.primary,   // #ffb114 — ámbar
			'#e8590c',               // naranja quemado
			'#7a3305',               // marrón medio
			'#4A2003',               // marrón oscuro (máx)
		])
	).domain([1, data.maxActiveFires])
);
export function circleColor(value) {
	return circleColorScale(value);
}

// Outline marking the "worst days" (above severeFiresThreshold), shared by
// the canvas draw code and the day-count badge.
export const severeOutlineColor = '#555';

// Focus ring around the highlighted day in the tooltip's year detail.
// Canvas needs a literal: this matches --bw900 from the bw scale above.
export const focusRingColor = '#1a1a1a';

// WCAG relative luminance, used to pick a text color that stays readable
// against the circle's background across the whole scale (light yellow
// through near-black brown).
function relativeLuminance(cssColor) {
	const { r, g, b } = color(cssColor).rgb();
	const [rl, gl, bl] = [r, g, b].map((channel) => {
		const c = channel / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

export function circleTextColor(value) {
	return relativeLuminance(circleColorScale(value)) > 0.55 ? 'var(--bw990)' : 'white';
}
