import type { BusLogicAPI } from '$lib/buslogic/api/BusLogicAPI';
import { BusLogicAPIV1 } from '$lib/buslogic/api/BusLogicAPIV1';
import { BusLogicAPIV2 } from '$lib/buslogic/api/BusLogicAPIV2';

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
	ni : new BusLogicAPIV1({
		city: 'Niš',
		baseUrl: 'https://online.jgpnis.rs',
		apiKey: 'cddfd29e495b4851965d'
	})
};

export const getInstance = (city: string) => {
	if (instances[city]) {
		return instances[city];
	}
	throw new Error(`Unknown city: ${city}`);
};

export const getCities = () => {
	return Object.entries(instances).map(([key, value]) => ({
		key,
		name: value.city
	}));
};
