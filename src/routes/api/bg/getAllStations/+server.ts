import type { BusLogicAPI } from '$lib/buslogic/api/BusLogicAPI';
import { BusLogicAPIV2 } from '$lib/buslogic/api/BusLogicAPIV2';
import { error, json, type RequestEvent } from '@sveltejs/kit';

export const GET = async ({ params, fetch }: RequestEvent) => {
	const api: BusLogicAPI = new BusLogicAPIV2({
		city: 'Beograd',
		baseUrl: 'https://announcement-bgnaplata.ticketing.rs',
		apiKey: '1688dc355af72ef09287',
		encKey: '3+Lhz8XaOli6bHIoYPGuq9Y8SZxEjX6eN7AFPZuLCLs=',
		encIV: 'IvUScqUudyxBTBU9ZCyjow=='
	});
	const stations = await api.getAllStations();

	return json(stations);
};
