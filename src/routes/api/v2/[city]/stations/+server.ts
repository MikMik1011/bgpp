import type { BusLogicAPI } from '$lib/buslogic/api/BusLogicAPI';
import { BusLogicAPIV2 } from '$lib/buslogic/api/BusLogicAPIV2';
import { error, json, type RequestEvent } from '@sveltejs/kit';
import { cacheRunner, getInstance } from '../../busLogicManager';

export const GET = async ({ params, fetch }: RequestEvent) => {
	if (!params.city) {
		return error(400, 'City is required');
	}
	const city = params.city;
	const api: BusLogicAPI = getInstance(city);
	if (!api) {
		return error(400, `City ${city} is not supported`);
	}
	if (!cacheRunner.hasFunction(city)) {
		await cacheRunner.addFunction(city, api.getAllStations.bind(api));
	}
	const stations = await cacheRunner.get(city);


	return json(Object.values(stations));
};
