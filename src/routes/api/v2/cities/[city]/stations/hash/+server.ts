import { error, json, type RequestEvent } from '@sveltejs/kit';
import { bgppService } from '../../../../bgppManager';
import { defaultHash } from '$lib/utils/hash';

export const GET = async ({ params, fetch }: RequestEvent) => {
	if (!params.city) {
		return error(400, 'City is required');
	}
	const city = params.city;
	if (!bgppService.isCitySupported(city)) {
		return error(400, `City ${city} is not supported`);
	}
	const stations = await bgppService.getAllStations(city);
	if (!stations) {
		return error(500, 'Failed to retrieve stations');
	}
	const combinedHash = Object.values(stations)
		.map((station) => station.hash)
		.toSorted()
		.join('');
	const totalHash = defaultHash(combinedHash);

	return json({ hash: totalHash });
};
