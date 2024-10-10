import type { AllStationsResponse } from "$lib/buslogic/types";
import type { Selected } from "bits-ui";
import { derived, get, readable, readonly, writable } from "svelte/store";

export const city = writable<Selected<unknown> | undefined>(undefined);

export const cityStationMap = writable<{ [key: string]: AllStationsResponse }>({});
export const selectableStations = derived(cityStationMap, ($cityStationMap) => {
    return Object.entries($cityStationMap).reduce((acc, [city, stations]) => {
        const selectableStations = Object.entries(stations).map(([id, station]) => ({
            label: `${station.name} (${station.id})`,
            value: station.id
        }));
        acc[city] = selectableStations;
        return acc;
    }, {} as { [key: string]: {label : string, value : string}[] });
});

export const selectedId = writable<string>("0");
selectedId.subscribe((id) => {
    console.log("selected:", id);
});

const getStations = async (city : string) => {
    const res = await fetch(`./api/${city}/stations`);
    return await res.json();
};

city.subscribe((city) => {
    if(!city) return;
    const currCity = city.value as string;
    if(get(cityStationMap)[currCity] !== undefined) return;
    getStations(currCity).then((stations) => {
        cityStationMap.update((map) => {
            map[currCity] = stations;
            return map;
        });
    });
});

selectableStations.subscribe((map) => {
    console.log(map[get(city)?.value as string]);
});