import type { BusLogicAPI } from '$lib/buslogic/api/BusLogicAPI';
import { BusLogicAPIV1 } from '$lib/buslogic/api/BusLogicAPIV1';
import { BusLogicAPIV2 } from '$lib/buslogic/api/BusLogicAPIV2';
import { CachedFunctionRunner } from '$lib/timed-cache/CachedFunctionRunner';
import { LocalTimedCache } from '$lib/timed-cache/LocalTimedCache';
import type { AllStationsResponse, Coords } from '$lib/buslogic/types';
import { djb2Hash } from '$lib/utils/hash';

const instances: { [key: string]: BusLogicAPI } = {
	bg: new BusLogicAPIV2({
		city: 'Beograd',
		baseUrl: 'https://announcement-bgnaplata.ticketing.rs',
		apiKey: '1688dc355af72ef09287',
		encKey: '3+Lhz8XaOli6bHIoYPGuq9Y8SZxEjX6eN7AFPZuLCLs=',
		encIV: 'IvUScqUudyxBTBU9ZCyjow=='
	}),
	ns: new BusLogicAPIV1({
		city: 'Novi Sad',
		baseUrl: 'https://online.nsmart.rs',
		apiKey: '4670f468049bbee2260'
	}),
	ni: new BusLogicAPIV1({
		city: 'Niš',
		baseUrl: 'https://online.jgpnis.rs',
		apiKey: 'cddfd29e495b4851965d'
	})
};

export const hashFunction = djb2Hash;

const cityCenters = {
    bg: {lat: 44.81254796404323, lon: 20.46145496621977},
    ns: {lat: 45.267136, lon: 19.833549},
    ni: {lat: 43.3209, lon: 21.8958},
} as Record<string, Coords>;

const day = 60 * 60 * 24;
export const cacheRunner = new CachedFunctionRunner<AllStationsResponse>(
	new LocalTimedCache<AllStationsResponse>(day)
);

export const getInstance = (city: string) => {
	if (instances[city]) {
		return instances[city];
	}
	return null;
};

export const getCities = () => {
	return Object.entries(instances).map(([key, value]) => ({
		key,
		name: value.city,
		center: cityCenters[key]
	}));
};

