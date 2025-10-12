import type { BusLogicAPI } from '$lib/buslogic/api/BusLogicAPI';
import { error, json, type RequestEvent } from '@sveltejs/kit';
import { cacheRunner, getInstance } from '../../../busLogicManager';
import { addBoundingBoxesToStations } from './utils';

export const GET = async ({ params, url }: RequestEvent) => {
	if (!params.city) {
		return error(400, 'City is required');
	}
	const city = params.city;
	const api: BusLogicAPI | null = getInstance(city);
	if (!api) {
		return error(400, `City ${city} is not supported`);
	}
	if (!cacheRunner.hasFunction(city)) {
		await cacheRunner.addFunction(city, api.getAllStations.bind(api));
	}
	const stations = await cacheRunner.get(city);
	if (!stations) {
		return error(500, 'Failed to retrieve stations');
	}

	if(url.searchParams.has('radius')) {
		const radius = parseInt(url.searchParams.get('radius') || '0');
		if(isNaN(radius) || radius <= 0) {
			return error(400, 'Radius must be a positive number');
		}
		
		const stationsWithBoundingBox = addBoundingBoxesToStations(Object.values(stations), radius);
		return json(stationsWithBoundingBox);
	}


	return json(Object.values(stations));
};
