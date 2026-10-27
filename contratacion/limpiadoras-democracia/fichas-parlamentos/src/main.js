import { mount } from 'svelte';
import App from './App.svelte';

const appId = __APP_ID__;

// Embeds mount by class (not id) so several views can live in the same article.
// Each `.<appId>` div picks its view via the `view` attribute.
const targets = document.querySelectorAll(`.${appId}`);

if (targets.length === 0) {
  throw new Error(`No .${appId} elements found in DOM`);
}

const apps = Array.from(targets, (target) =>
  mount(App, {
    target,
    props: {
      lang: target.getAttribute('lang') ?? 'es',
      // Which view this embed shows: 'regions' (CCAA carousel), 'congreso' or
      // 'senado'. A ?view= URL param (for iframes) overrides this attribute.
      view: target.getAttribute('view'),
    },
  })
);

export default apps;
