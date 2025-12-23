import { BGPPService } from '$lib/bgpp/service/BGPPService';
import type { BusLogicRepo } from '$lib/buslogic/repo/BusLogicRepo';
import { BusLogicRepoV1 } from '$lib/buslogic/repo/BusLogicRepoV1';
import { BusLogicRepoV2 } from '$lib/buslogic/repo/BusLogicRepoV2';
import { ParserV1 } from '$lib/bgpp/parser/ParserV1';
import type { BGPPCity, CityID, Coords } from '$lib/types';
import { NodeCacheStore } from '@cacheable/node-cache';

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
const parserV1 = new ParserV1();

const cities: Record<CityID, BGPPCity> = {
	bg: { city: 'Beograd', center: cityCenters['bg'], repo: repos['bg'], parser: parserV1 },
	ns: { city: 'Novi Sad', center: cityCenters['ns'], repo: repos['ns'], parser: parserV1 },
	ni: { city: 'Niš', center: cityCenters['ni'], repo: repos['ni'], parser: parserV1 }
};

export const bgppService = new BGPPService(new NodeCacheStore(), cities)

export const getCities = () => {
	return Object.entries(cities).map(([key, value]) => ({
		id: key,
		name: value.city,
		center: value.center
	}));
};
