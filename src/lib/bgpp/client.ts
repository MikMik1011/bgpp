import type { Coords, Line, Station } from '$lib/types';

export type City = {
	id: string;
	name: string;
	center: Coords;
};

export type ArrivalsResponse = {
	station: Station;
	lines: Line[];
};

const jsonFetch = async <T>(fetchFn: typeof fetch, url: string): Promise<T> => {
	const res = await fetchFn(url);
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.message ?? `Zahtev ka ${url} nije uspeo (${res.status})`);
	}
	return res.json();
};

export const getCities = (fetchFn: typeof fetch = fetch) =>
	jsonFetch<City[]>(fetchFn, '/api/v2/cities');

export const getStations = (city: string, fetchFn: typeof fetch = fetch) =>
	jsonFetch<Station[]>(fetchFn, `/api/v2/cities/${encodeURIComponent(city)}/stations`);

export const getArrivals = (city: string, stationId: string, fetchFn: typeof fetch = fetch) =>
	jsonFetch<ArrivalsResponse>(
		fetchFn,
		`/api/v2/cities/${encodeURIComponent(city)}/stations/${encodeURIComponent(stationId)}/arrivals`
	);
