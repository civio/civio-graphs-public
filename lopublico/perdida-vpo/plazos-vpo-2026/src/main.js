import { mount } from 'svelte';
import App from './App.svelte';

const appId = __APP_ID__;
const target = document.getElementById(appId);

if (!target) {
  throw new Error(`Element #${appId} not found in DOM`);
}

const app = mount(App, {
  target,
  props: {
    lang: target.getAttribute('lang') ?? 'es',
    chartID: target.id,
    a11y: target.hasAttribute('data-a11y'),
    alt: target.hasAttribute('data-alt'),
  },
});

export default app;
