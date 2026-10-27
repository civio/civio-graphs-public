## Código de incrustación

El gráfico tiene **tres vistas** que se eligen con el atributo `view` en el `<div>`:

| `view`     | Muestra                                         |
| ---------- | ----------------------------------------------- |
| `regions`  | Carrusel de comunidades autónomas (por defecto) |
| `congreso` | Ficha del Congreso                              |
| `senado`   | Ficha del Senado                                |

El montaje es **por clase** (`fichas-parlamentos`), no por `id`, para poder poner los tres `<div>` en el mismo artículo. Si se omite el atributo `view`, se muestra `regions`. Pega el `<div>` que corresponda donde quieras cada vista:

<!-- pegar donde queremos que se muestre cada vista -->
<div class="fichas-parlamentos" view="regions" style="max-width: 800px; margin: 0 auto"></div>
<div class="fichas-parlamentos" view="congreso" style="max-width: 800px; margin: 0 auto"></div>
<div class="fichas-parlamentos" view="senado" style="max-width: 800px; margin: 0 auto"></div>

<!-- pegar al final de la noticia (una sola vez) -->
<script type="text/javascript">
    const dateId = new Date().getTime() // To avoid cache problems

    // CSS
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://graphs.civio.es/contratacion/limpiadoras-democracia/fichas-parlamentos/dist/assets/index.css?q=${dateId}`;
    document.body.appendChild(link);

    // JAVASCRIPT
    var script = document.createElement('script');
    script.type = 'module';
    script.src = `https://graphs.civio.es/contratacion/limpiadoras-democracia/fichas-parlamentos/dist/assets/index.js?q=${dateId}`;
    document.body.appendChild(script);
</script>

## Código de compartir iframe

Cada vista tiene su propio botón **Incrustar**, que copia el iframe de esa vista: `dist/iframes/fichas-parlamentos-<vista>-<idioma>-responsive.md`. En iframes (y en cualquier URL) la vista se elige con el parámetro `?view=`, que tiene prioridad sobre el atributo `view` del `<div>`. Por ejemplo, `…/fichas-parlamentos/dist/?view=senado`.

Los tres archivos se generan con un solo comando:

```bash
npm run iframe   # mide y genera las tres vistas (public/iframes/)
npm run build    # las copia a dist/iframes/; después, subir dist
```

Cómo mide el script (`generate-breakpoints.js`):

- Carga `?view=<vista>` y mide el `div.fichas-parlamentos` completo, con el pie incluido.
- Para cada punto de corte, toma la altura **máxima** de todo el tramo hasta el siguiente punto (mide cada 10 px). Así el iframe no corta el contenido entre dos puntos de corte, aunque la foto crezca con el ancho.
- En el carrusel recorre las 17 comunidades y se queda con la más alta, porque los nombres de empresa largos ocupan dos líneas en móvil.
- Tarda unos 4 minutos, casi todo en el carrusel.

```bash
npm run iframe -- --views=congreso,senado   # solo algunas vistas (ojo al -- de npm)
npm run iframe -- --languages=es,en         # otros idiomas (por defecto, los de package.json)
```

Hay que volver a generar los iframes si cambia la altura de las fichas: textos, datos o maquetación.

## Scripts de Linting

### Scripts disponibles

| Script      | Comando             | Descripción                                     |
| ----------- | ------------------- | ----------------------------------------------- |
| `lint`      | `npm run lint`      | Linting completo del código                     |
| `lint:deps` | `npm run lint:deps` | Detectar código muerto y dependencias no usadas |
| `lint:fix`  | `npm run lint:fix`  | Corregir errores automáticamente                |
| `lint:all`  | `npm run lint:all`  | Linting completo + análisis de dependencias     |

---

### Detalle de cada script

#### `npm run lint`

Ejecuta Oxlint con todas las reglas configuradas. Soporta archivos `.svelte` nativamente (lintea los bloques `<script>`).

**Reglas e18e (ecosistema moderno de JS):**

- `e18e/prefer-includes` → Usar `includes()` en vez de `indexOf() !== -1`
- `e18e/prefer-array-at` → Usar `array.at()` para acceso por índice
- `e18e/prefer-array-fill` → Usar `array.fill()` en vez de bucles
- `e18e/prefer-array-to-reversed` → Usar `toReversed()` (método inmutable)
- `e18e/prefer-array-to-sorted` → Usar `toSorted()` (método inmutable)
- `e18e/prefer-array-to-spliced` → Usar `toSpliced()` (método inmutable)
- `e18e/prefer-nullish-coalescing` → Usar `??` en vez de `||` cuando aplique
- `e18e/prefer-object-has-own` → Usar `Object.hasOwn()` en vez de `hasOwnProperty()`
- `e18e/prefer-spread-syntax` → Usar spread `[...arr]` en vez de `Array.concat()`
- `e18e/prefer-url-canparse` → Usar `URL.canParse()` para validar URLs
- `e18e/prefer-array-from-map` → Usar `Array.from(iterable, mapFn)`
- `e18e/prefer-timer-args` → Pasar argumentos a `setTimeout`/`setInterval`
- `e18e/prefer-date-now` → Usar `Date.now()` en vez de `new Date().getTime()`
- `e18e/prefer-regex-test` → Usar `regex.test()` en vez de `regex.match()`
- `e18e/prefer-array-some` → Usar `some()` en vez de `find() !== undefined`

**Reglas unicorn (mejores prácticas):**

- `unicorn/prefer-array-flat-map` → Usar `flatMap()` en vez de `map().flat()`
- `unicorn/prefer-array-flat` → Usar `flat()` en vez de alternativas manuales
- `unicorn/prefer-string-replace-all` → Usar `replaceAll()` en vez de `replace(/g)`
- `unicorn/prefer-string-starts-ends-with` → Usar `startsWith()`/`endsWith()`

**Reglas de calidad de código:**

- `no-debugger` → No dejar `debugger` en el código
- `no-empty` → No dejar bloques vacíos
- `no-extra-boolean-cast` → Evitar dobles negaciones innecesarias (`!!`)
- `no-irregular-whitespace` → Detectar espacios irregulares
- `no-loss-of-precision` → Evitar pérdida de precisión en números
- `no-unsafe-negation` → Evitar negaciones inseguras
- `valid-typeof` → Validar strings en comparaciones `typeof`
- `eqeqeq` → Usar `===` en vez de `==` (warning)
- `no-var` → Usar `let`/`const` en vez de `var`
- `prefer-const` → Usar `const` cuando la variable no se reasigna (warning)

#### `npm run lint:deps`

Ejecuta Knip para detectar:

- Archivos no utilizados
- Exports no usados
- Dependencias en `package.json` que no se usan
- Dependencias faltantes

#### `npm run lint:fix`

Ejecuta Oxlint con la opción `--fix` para corregir automáticamente los errores que tienen solución automática.

#### `npm run lint:all`

Ejecuta el linting completo y además el análisis de dependencias con Knip. Ideal para CI/CD o antes de hacer commit.

---

### Uso recomendado

| Situación            | Script      |
| -------------------- | ----------- |
| Desarrollo diario    | `lint`      |
| Antes de commit      | `lint`      |
| Antes de PR/merge    | `lint:all`  |
| Limpiar dependencias | `lint:deps` |
