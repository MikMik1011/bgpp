import type { BusLogicAPI } from '$lib/buslogic/api/BusLogicAPI';
import { json, type RequestEvent } from '@sveltejs/kit';
import { getInstance } from '../../../busLogicManager';

export const GET = async ({ params }: RequestEvent) => {
	const api : BusLogicAPI = getInstance(params.city ?? '');
	const stations = await api.getAllStations();
	const station = stations[params.stationId?.toUpperCase() ?? '0'];
	const lines = await api.getStationArrivals(station);
	return json({ station, lines });
};
