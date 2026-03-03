import { scaleLinear, range } from 'd3';

// Set project area as chosen when creating the project. It will be use for our project colors & also for our main div class in App
export const appArea = 'justicia';

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
const projectColorsCSS = Object.entries(projectColors)
  .map(([key, value]) => `--${key}: ${value}`)
  .join(';');

// Ref of CSS relative colors
// https://ishadeed.com/article/css-relative-colors/
const makePalette = (base) => ({
  base,
  light: `hsl(from ${base} h s calc(l + 20))`,
  mid: base,
  dark: `hsl(from ${base} h s calc(l - 20))`,
});

const catColors = {
  age: makePalette('#c76deb'),
  pv: makePalette('#109bf6'),
  cat: makePalette('#08a6bf'),
};

const customColors = Object.fromEntries(
  Object.entries(catColors).flatMap(([key, { base, light, mid, dark }]) => [
    [key, base],
    [`${key}_cat_1`, light],
    [`${key}_cat_2`, mid],
    [`${key}_cat_3`, dark],
    [`${key}_gradient`, `linear-gradient(90deg, ${light} 0%, ${mid} 50%, ${dark} 100%)`],
  ])
);

export const customColorsCSS = Object.entries(customColors)
  .map(([key, value]) => `--${key.toLowerCase()}: ${value}`)
  .join(';');

// Our black & white color scale
const bwScale = scaleLinear().domain([0, 1000]).range(['white', 'black']);
export const bwScaleCSS = range(0, 1000, 10) // start, end, steps
  .map((d) => `--bw${d}: ${bwScale(d)}`)
  .join(';');
