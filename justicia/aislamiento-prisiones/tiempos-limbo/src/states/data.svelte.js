// based on https://github.com/spiegelgraphics/svelte-5-utilities/blob/main/data.svelte.js

/**
 * @store Data
 *
 * This module defines a `Data` class that fetches data from a JSON file and stores it in a reactive state.
 * It also provides a derived state based on the fetched data.
 *
 */

// export a single instance of the Data class, this should only be done once per store and project
export const data = [["<= 15", { "count": 3760, "perc": 48.205128205128204 }], [">15 & <= 30", { "count": 1559, "perc": 19.98717948717949 }], [">30 & <= 93", { "count": 1984, "perc": 25.435897435897438 }], [">93 & <= 365", { "count": 489, "perc": 6.269230769230768 }], ["> 365", { "count": 8, "perc": 0.10256410256410256 }]]
