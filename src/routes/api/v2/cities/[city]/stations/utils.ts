import type { Station } from '$lib/buslogic/types';

type BoundingBox = {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
}

type StationWithBoundingBox = Station & {
    boundingBox: BoundingBox;
}

const calculateBoundingBox = (station : Station, radiusInMeters: number) : BoundingBox => {
    const lat = Number(station.coords.lat);
    const lon = Number(station.coords.lon);

    const earthRadius = 6371000; // meters
    const deltaLat = radiusInMeters / earthRadius * (180 / Math.PI);
    const deltaLon = radiusInMeters / (earthRadius * Math.cos(Math.PI * lat / 180)) * (180 / Math.PI);

    return {
        minLat: lat - deltaLat,
        maxLat: lat + deltaLat,
        minLon: lon - deltaLon,
        maxLon: lon + deltaLon
    };
}

export const addBoundingBoxesToStations = (stations: Station[], radiusInMeters: number) : StationWithBoundingBox[] => {
    return stations.map(station => {
        const boundingBox = calculateBoundingBox(station, radiusInMeters);
        return {
            ...station,
            boundingBox
        };
    });
}