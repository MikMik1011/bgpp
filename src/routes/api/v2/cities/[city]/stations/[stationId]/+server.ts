import type { BusLogicAPI } from '$lib/buslogic/api/BusLogicAPI';
import { error, json, type RequestEvent } from '@sveltejs/kit';
import { cacheRunner, getInstance } from '../../../../busLogicManager';
import { addBoundingBoxesToStations } from '../utils';

export const GET = async ({ params, url }: RequestEvent) => {
	if (!params.city) {
		return error(400, 'City is required');
	}
	if(!params.stationId) {
		return error(400, 'Station ID is required');
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

	const station = stations[params.stationId.toUpperCase() ?? '0'];
	if (!station) {
		return error(404, `Station ID ${params.stationId} not found`);
	}

	if(url.searchParams.has('radius')) {
		const radius = parseInt(url.searchParams.get('radius') || '0');
		if(isNaN(radius) || radius <= 0) {
			return error(400, 'Radius must be a positive number');
		}
		
		const stationWithBoundingBox = addBoundingBoxesToStations([station], radius)[0];
		return json(stationWithBoundingBox);
	}

	return json(station);
};
