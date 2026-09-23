import type { Station } from '$lib/types';
import type { Selected } from 'bits-ui';
import { derived, get, writable } from 'svelte/store';
import { getStations } from '$lib/bgpp/client';

export const city = writable<Selected<string> | undefined>(undefined);

export const dataSaver = writable(true);
export const sortLines = writable(false);
export const arrivalsDialogOpen = writable(false);

export const selectedStationId = writable<string>('');

export const cityStationMap = writable<Record<string, Station[]>>({});

export const selectableStations = derived(cityStationMap, ($cityStationMap) =>
	Object.entries($cityStationMap).reduce(
		(acc, [cityId, stations]) => {
			acc[cityId] = stations.map((station) => ({
				label: `${station.name} (${station.id})`,
				value: station.id
			}));
			return acc;
		},
		{} as Record<string, { label: string; value: string }[]>
	)
);

city.subscribe((selected) => {
	if (!selected) return;
	const cityId = selected.value;
	if (get(cityStationMap)[cityId]) return;
	getStations(cityId).then((stations) => {
		cityStationMap.update((map) => ({ ...map, [cityId]: stations }));
	});
});

city.subscribe(() => {
	selectedStationId.set('');
});
