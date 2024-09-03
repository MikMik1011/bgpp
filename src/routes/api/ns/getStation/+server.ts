import type { BusLogicAPI } from '$lib/buslogic/api/BusLogicAPI';
import { BusLogicAPIV1 } from '$lib/buslogic/api/BusLogicAPIV1';
import { error, json, type RequestEvent } from '@sveltejs/kit';

export const GET = async ({ params, fetch }: RequestEvent) => {
	const api: BusLogicAPI = new BusLogicAPIV1({
		city: 'Novi Sad',
		baseUrl: 'https://online.nsmart.rs',
		apiKey: '4670f468049bbee2260'
	});
    
	const stations = await api.getAllStations();
	const station = stations['6728'];
	const lines = await api.getStationArrivals(station);
	return json({ station, lines });
};
