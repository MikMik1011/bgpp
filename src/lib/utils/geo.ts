import type { Coords } from '$lib/types';

const EARTH_RADIUS_METERS = 6371000;

export const getDistanceMeters = (a: Coords, b: Coords): number => {
	const deltaLat = (b.lat - a.lat) * (Math.PI / 180);
	const deltaLon = (b.lon - a.lon) * (Math.PI / 180);
	const sinLat = Math.sin(deltaLat / 2);
	const sinLon = Math.sin(deltaLon / 2);
	const h =
		sinLat * sinLat +
		Math.cos(a.lat * (Math.PI / 180)) * Math.cos(b.lat * (Math.PI / 180)) * sinLon * sinLon;
	return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export const getUserLocation = (): Promise<Coords> => {
	return new Promise((resolve, reject) => {
		if (!('geolocation' in navigator)) {
			reject(new Error('Geolokacija nije dostupna u ovom pregledaču.'));
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
			() => reject(new Error('Greška pri dobavljanju lokacije.'))
		);
	});
};
