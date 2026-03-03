import { mount } from 'svelte';
import App from './App.svelte';

const appId = __APP_ID__;
const instances = [];

const targets = document.querySelectorAll(`.${appId}`);
const typeFilter = new URLSearchParams(window.location.search).get('type');

targets.forEach((target) => {
	const targetType = target.getAttribute('type');
	if (typeFilter && targetType !== typeFilter) return;

	instances.push(
		mount(App, {
			target,
			props: {
				lang: target.getAttribute('lang') ?? 'es',
				chartID: appId,
				a11y: target.hasAttribute('data-a11y'),
				alt: target.hasAttribute('data-alt'),
				type: target.getAttribute('type')
			},
		})
	);
});

export default instances;
