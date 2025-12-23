import type { BusLogicAPI } from '$lib/buslogic/api/BusLogicAPI';
import { error, json, type RequestEvent } from '@sveltejs/kit';
import { getInstance } from '../../../../../busLogicManager';

export const GET = async ({ params }: RequestEvent) => {
	if(!params.city) {
		return error(400, 'City is required');
	}
	if(!params.stationId) {
		return error(400, 'Station ID is required');
	}
	const city = params.city;
	const api: BusLogicAPI | null = getInstance(city);
	if(!api) {
		return error(400, `City ${city} is not supported`);
	}
	
	const stations = await api.getAllStations();
	const station = stations[params.stationId.toUpperCase() ?? '0'];
	if(!station) {
		return error(404, `Station ID ${params.stationId} not found`);
	}
	const lines = await api.getStationLiveArrivals(station);
	return json({ station, lines });
};
