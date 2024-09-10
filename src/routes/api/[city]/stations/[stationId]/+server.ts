import type { BusLogicAPI } from '$lib/buslogic/api/BusLogicAPI';
import { error, json, type RequestEvent } from '@sveltejs/kit';
import { cacheRunner, getInstance } from '../../../busLogicManager';

export const GET = async ({ params }: RequestEvent) => {
	if(!params.city) {
		return error(400, 'City is required');
	}
	const city = params.city;
	const api : BusLogicAPI = getInstance(city);
	if(!api) {
		return error(400, `City ${city} is not supported`);
	}
	if(!cacheRunner.hasFunction(city)) {
		await cacheRunner.addFunction(city, api, 'getAllStations');
	}
	const stations = await cacheRunner.get(city);
	const station = stations[params.stationId?.toUpperCase() ?? '0'];
	const lines = await api.getStationArrivals(station);
	return json({ station, lines });
};
