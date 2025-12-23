import { error, json, type RequestEvent } from '@sveltejs/kit';
import { bgppService } from '../../../../../bgppManager';

export const GET = async ({ params }: RequestEvent) => {
	if(!params.city) {
		return error(400, 'City is required');
	}
	if(!params.stationId) {
		return error(400, 'Station ID is required');
	}

	const city = params.city;
	if (!bgppService.isCitySupported(city)) {
		return error(400, `City ${city} is not supported`);
	}
	
	const stations = await bgppService.getAllStations(city);
	if (!stations) {
		return error(500, 'Failed to retrieve stations');
	}
	const station = stations[params.stationId.toUpperCase() ?? '0'];
	if(!station) {
		return error(404, `Station ID ${params.stationId} not found`);
	}
	const lines = await bgppService.getStationLiveArrivals(city, station);
	return json({ station, lines });
};
