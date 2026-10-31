import { BGPPService } from '$lib/server/service/BGPPService';
import type { BusLogicRepo } from '$lib/server/providers/buslogic/repo/BusLogicRepo';
import { BusLogicRepoV1 } from '$lib/server/providers/buslogic/repo/BusLogicRepoV1';
import { BusLogicRepoV2 } from '$lib/server/providers/buslogic/repo/BusLogicRepoV2';
import type { CityID, Coords } from '$lib/shared/types';
import type { BGPPCity } from '$lib/server/ports';
import { NodeCacheStore } from '@cacheable/node-cache';
import { BusLogicSource } from './providers/buslogic/BusLogicSource';
import { BusLogicParser } from './providers/buslogic/parser/BusLogicParser';


const repos: { [id: string]: BusLogicRepo } = {
	bg: new BusLogicRepoV2({
		baseUrl: 'https://announcement-bgnaplata.ticketing.rs',
		apiKey: '1688dc355af72ef09287',
		encKey: '3+Lhz8XaOli6bHIoYPGuq9Y8SZxEjX6eN7AFPZuLCLs=',
		encIV: 'IvUScqUudyxBTBU9ZCyjow=='
	}),
	ns: new BusLogicRepoV1({
		baseUrl: 'https://online.nsmart.rs',
		apiKey: '4670f468049bbee2260'
	}),
	ni: new BusLogicRepoV1({
		baseUrl: 'https://online.jgpnis.rs',
		apiKey: 'cddfd29e495b4851965d'
	})
};

const cityCenters = {
	bg: { lat: 44.81254796404323, lon: 20.46145496621977 },
	ns: { lat: 45.267136, lon: 19.833549 },
	ni: { lat: 43.3209, lon: 21.8958 }
} as Record<string, Coords>;

const busLogicParser = new BusLogicParser();
const sources = {
	ns: new BusLogicSource(repos['ns'], busLogicParser),
	ni: new BusLogicSource(repos['ni'], busLogicParser)
};

const cities: Record<CityID, BGPPCity> = {
	// bg: { city: 'Beograd', center: cityCenters['bg'], timezone: 'Europe/Belgrade', stations: bg, live: bg }, // currently disabled due to API issues
	ns: { city: 'Novi Sad', center: cityCenters['ns'], timezone: 'Europe/Belgrade', stations: sources.ns, live: sources.ns },
	ni: { city: 'Niš', center: cityCenters['ni'], timezone: 'Europe/Belgrade', stations: sources.ni, live: sources.ni }
};

export const bgppService = new BGPPService(new NodeCacheStore(), cities)

// Hydrate the station lists at startup so the first requests don't wait on the upstream APIs
for (const city of Object.keys(cities)) {
	bgppService
		.getAllStations(city)
		.catch((err) => console.error(`Failed to prewarm stations for ${city}:`, err));
}

export const getCities = () => {
	return Object.entries(cities).map(([key, value]) => ({
		id: key,
		name: value.city,
		center: value.center
	}));
};
