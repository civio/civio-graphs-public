// based on https://github.com/spiegelgraphics/svelte-5-utilities/blob/main/data.svelte.js

/**
 * @store Data
 *
 * This module defines a `Data` class that fetches data from a JSON file and stores it in a reactive state.
 * It also provides a derived state based on the fetched data.
 *
 */

import { groups } from 'd3';

export class Data {
	value = $state(undefined);
	grouped = $derived(this.value &&
		groups(this.value, d => d.year, d => d.adm).map(d => ({
			year: d[0],
			data: d[1].map(y => ({ adm: y[0], categories: y[1] }))
		}))
	)
}


export const proteccion = [{ "year": 2020, "total": 1216, "relX1000": 25.515664015779425, "adm": "AGE" },
{ "year": 2021, "total": 1121, "relX1000": 23.810029523587012, "adm": "AGE" },
{ "year": 2022, "total": 1432, "relX1000": 30.69733541983751, "adm": "AGE" },
{ "year": 2023, "total": 1642, "relX1000": 35.01514052970529, "adm": "AGE" },
{ "year": 2024, "total": 1543, "relX1000": 31.82755775577558, "adm": "AGE" },
{ "year": 2025, "total": 796, "relX1000": 15.982972913278315, "adm": "AGE" },
{ "year": 2020, "total": 540, "relX1000": 68.4931506849315, "adm": "CAT" },
{ "year": 2021, "total": 519, "relX1000": 67.00232378001549, "adm": "CAT" },
{ "year": 2022, "total": 485, "relX1000": 62.880850512122386, "adm": "CAT" },
{ "year": 2023, "total": 470, "relX1000": 58.443173339965185, "adm": "CAT" },
{ "year": 2024, "total": 379, "relX1000": 44.10053525715615, "adm": "CAT" },
{ "year": 2025, "total": 207, "relX1000": 24.08657202699558, "adm": "CAT" },
{ "year": 2021, "total": 9, "relX1000": 6.4888248017303525, "adm": "PV" },
{ "year": 2022, "total": 19, "relX1000": 12.0942075111394, "adm": "PV" },
{ "year": 2023, "total": 32, "relX1000": 19.975031210986266, "adm": "PV" },
{ "year": 2024, "total": 45, "relX1000": 27.305825242718445, "adm": "PV" },
{ "year": 2025, "total": 30, "relX1000": 17.07455890722823, "adm": "PV" }]


export const sancion = [{ "year": 2020, "tipo_sancion": "Aislamiento en celda", "total": 7745, "relX1000": 162.51547516629248, "adm": "AGE" },
{ "year": 2020, "tipo_sancion": "Fin de semana de aislamiento", "total": 1924, "relX1000": 40.371823656545736, "adm": "AGE" },
{ "year": 2021, "tipo_sancion": "Aislamiento en celda", "total": 7560, "relX1000": 160.5743293472951, "adm": "AGE" },
{ "year": 2021, "tipo_sancion": "Fin de semana de aislamiento", "total": 1809, "relX1000": 38.42314309381704, "adm": "AGE" },
{ "year": 2022, "tipo_sancion": "Aislamiento en celda", "total": 7874, "relX1000": 168.7924714356149, "adm": "AGE" },
{ "year": 2022, "tipo_sancion": "Fin de semana de aislamiento", "total": 1806, "relX1000": 38.714656262728035, "adm": "AGE" },
{ "year": 2023, "tipo_sancion": "Aislamiento en celda", "total": 7853, "relX1000": 167.46278841642854, "adm": "AGE" },
{ "year": 2023, "tipo_sancion": "Fin de semana de aislamiento", "total": 1762, "relX1000": 37.57410329679703, "adm": "AGE" },
{ "year": 2024, "tipo_sancion": "Aislamiento en celda", "total": 6223, "relX1000": 128.36221122112212, "adm": "AGE" },
{ "year": 2024, "tipo_sancion": "Fin de semana de aislamiento", "total": 1256, "relX1000": 25.90759075907591, "adm": "AGE" },
{ "year": 2025, "tipo_sancion": "Aislamiento en celda", "total": 531, "relX1000": 10.662008312752244, "adm": "AGE" },
{ "year": 2025, "tipo_sancion": "Fin de semana de aislamiento", "total": 59, "relX1000": 1.1846675903058048, "adm": "AGE" },
{ "year": 2020, "tipo_sancion": "Aislamiento en celda", "total": 5009, "relX1000": 635.3373921867072, "adm": "CAT" },
{ "year": 2020, "tipo_sancion": "Fin de semana de aislamiento", "total": 723, "relX1000": 91.70471841704718, "adm": "CAT" },
{ "year": 2021, "tipo_sancion": "Aislamiento en celda", "total": 4996, "relX1000": 644.9780531887426, "adm": "CAT" },
{ "year": 2021, "tipo_sancion": "Fin de semana de aislamiento", "total": 587, "relX1000": 75.78104828298477, "adm": "CAT" },
{ "year": 2022, "tipo_sancion": "Aislamiento en celda", "total": 7058, "relX1000": 915.0784389990924, "adm": "CAT" },
{ "year": 2022, "tipo_sancion": "Fin de semana de aislamiento", "total": 749, "relX1000": 97.10877738882407, "adm": "CAT" },
{ "year": 2023, "tipo_sancion": "Aislamiento en celda", "total": 8613, "relX1000": 1071.0022382491918, "adm": "CAT" },
{ "year": 2023, "tipo_sancion": "Fin de semana de aislamiento", "total": 855, "relX1000": 106.31683660780901, "adm": "CAT" },
{ "year": 2024, "tipo_sancion": "Aislamiento en celda", "total": 7419, "relX1000": 863.2767046776821, "adm": "CAT" },
{ "year": 2024, "tipo_sancion": "Fin de semana de aislamiento", "total": 578, "relX1000": 67.25622527344659, "adm": "CAT" },
{ "year": 2025, "tipo_sancion": "Aislamiento en celda", "total": 4304, "relX1000": 500.81452175936704, "adm": "CAT" },
{ "year": 2025, "tipo_sancion": "Fin de semana de aislamiento", "total": 304, "relX1000": 35.37351640679544, "adm": "CAT" },
{ "year": 2021, "tipo_sancion": "Aislamiento en celda", "total": 15, "relX1000": 10.814708002883922, "adm": "PV" },
{ "year": 2021, "tipo_sancion": "Fin de semana de aislamiento", "total": 9, "relX1000": 6.4888248017303525, "adm": "PV" },
{ "year": 2022, "tipo_sancion": "Aislamiento en celda", "total": 76, "relX1000": 48.3768300445576, "adm": "PV" },
{ "year": 2022, "tipo_sancion": "Fin de semana de aislamiento", "total": 14, "relX1000": 8.911521323997455, "adm": "PV" },
{ "year": 2023, "tipo_sancion": "Aislamiento en celda", "total": 139, "relX1000": 86.7665418227216, "adm": "PV" },
{ "year": 2023, "tipo_sancion": "Fin de semana de aislamiento", "total": 48, "relX1000": 29.9625468164794, "adm": "PV" },
{ "year": 2024, "tipo_sancion": "Aislamiento en celda", "total": 196, "relX1000": 118.93203883495146, "adm": "PV" },
{ "year": 2024, "tipo_sancion": "Fin de semana de aislamiento", "total": 36, "relX1000": 21.844660194174757, "adm": "PV" },
{ "year": 2025, "tipo_sancion": "Aislamiento en celda", "total": 124, "relX1000": 70.57484348321002, "adm": "PV" },
{ "year": 2025, "tipo_sancion": "Fin de semana de aislamiento", "total": 18, "relX1000": 10.244735344336938, "adm": "PV" }]
