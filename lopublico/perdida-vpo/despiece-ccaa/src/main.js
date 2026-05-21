import { mount } from 'svelte';
import App from './App.svelte';
import { urlInfo } from './states/utils.svelte';
import { ccaaDisplayNames } from './states/ccaaCatalog';

const appId = __APP_ID__;
// HTML technically forbids duplicate ids, but browsers tolerate them and an
// article may legitimately embed the same chart twice. `'#id'` is optimised
// to a single match, so we use the attribute selector to grab them all.
const targets = document.querySelectorAll(`[id="${appId}"]`);

if (targets.length === 0) {
	throw new Error(`Element #${appId} not found in DOM`);
}

// Seed a11y/alt overrides from embed attributes so ?a11y / ?alt URL params
// and data-a11y / data-alt attributes both activate debug/alt modes. If any
// embed on the page asks for them, they apply globally.
urlInfo.attrA11y = Array.from(targets).some((t) => t.hasAttribute('data-a11y'));
urlInfo.attrAlt = Array.from(targets).some((t) => t.hasAttribute('data-alt'));

const apps = [];

const embed = urlInfo.isEmbed ? { ccaa: urlInfo.embedCcaa, chart: urlInfo.embedChart } : null;
const placeholderAttr = (chart) => (chart === 'laws' ? 'laws-chart' : 'area-chart');

for (const target of targets) {
	let ccaaSections;

	if (embed) {
		// Single-chart embed: rebuild the target as one minimal section that
		// holds only the requested chart placeholder — no prose, no heading.
		const sourceSection = target.querySelector(`section[data-ccaa="${embed.ccaa}"]`);
		const placeholder = sourceSection?.querySelector(`[${placeholderAttr(embed.chart)}]`);

		if (!sourceSection || !placeholder) {
			target.textContent = `Gráfico no disponible (ccaa="${embed.ccaa}", chart="${embed.chart}").`;
			target.style.opacity = '1';
			continue;
		}

		const minimal = document.createElement('section');
		minimal.dataset.ccaa = sourceSection.dataset.ccaa;
		minimal.appendChild(placeholder);
		target.replaceChildren();
		ccaaSections = [
			{
				id: sourceSection.dataset.ccaa,
				name: ccaaDisplayNames[sourceSection.dataset.ccaa] ?? sourceSection.dataset.ccaa,
				element: minimal,
			},
		];
	} else {
		// Extract CCAA sections as DOM elements (keep them alive for embedded charts)
		const sectionElements = target.querySelectorAll('section[data-ccaa]');
		ccaaSections = Array.from(sectionElements).map((el) => ({
			id: el.dataset.ccaa,
			name: ccaaDisplayNames[el.dataset.ccaa] ?? el.dataset.ccaa,
			element: el,
		}));

		// Remove sections from target (Svelte will re-attach them to its container)
		sectionElements.forEach((el) => el.remove());
	}

	// Show the container (hidden initially to avoid FOUC)
	target.style.opacity = '1';

	apps.push(
		mount(App, {
			target,
			props: {
				lang: target.getAttribute('lang') ?? 'es',
				chartID: target.id,
				ccaaSections,
				embed,
			},
		})
	);

	// civio.es/assets/chunks/article.js fija el width de `.full-width` a
	// `calc(100vw - <scrollbar>px)` para evitar overflow horizontal, pero no
	// compensa el `left: calc(50% - 50vw)` del CSS. Recolocamos el wrapper que
	// contiene este chart sumándole la mitad del ancho de la scrollbar al `left`,
	// ejecutándolo después que el script de Civio.
	const fullWidthWrapper = target.closest('.full-width');
	if (fullWidthWrapper) {
		const recenter = () => {
			const sb = window.innerWidth - document.body.clientWidth;
			fullWidthWrapper.style.left = `calc(50% - 50vw + ${sb / 2}px)`;
		};
		requestAnimationFrame(recenter);
		window.addEventListener('resize', recenter);
	}
}

export default apps;
