import type { BusLogicAPI } from '$lib/buslogic/api/BusLogicAPI';
import { error, json, type RequestEvent } from '@sveltejs/kit';
import { cacheRunner, getInstance } from '../../../../busLogicManager';
import { defaultHash } from '$lib/utils/hash';

export const GET = async ({ params, fetch }: RequestEvent) => {
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

	const combinedHash = Object.values(stations).map(station => station.hash).toSorted().join('');
	const totalHash = defaultHash(combinedHash);

	return json({ hash: totalHash });
};
