import type { BusLogicAPI } from '$lib/buslogic/api/BusLogicAPI';
import { BusLogicAPIV2 } from '$lib/buslogic/api/BusLogicAPIV2';
import { error, json, type RequestEvent } from '@sveltejs/kit';
import { getInstance } from '../../busLogicManager';

export const GET = async ({ params, fetch }: RequestEvent) => {
	const api: BusLogicAPI = getInstance(params.city ?? '');
	const stations = await api.getAllStations();

	return json(stations);
};
