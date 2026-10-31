import type { AllStationsResponse, Coords, Line, ScheduledDeparture, Station } from '$lib/shared/types';

export interface StationSource {
	getStations(): Promise<AllStationsResponse>;
}
export interface LiveSource {
	getLiveArrivals(station: Station): Promise<Line[]>;
}
export interface ScheduleSource {
	getSchedule(station: Station, now: number): Promise<Record<string, ScheduledDeparture[]>>; // key: line number; now: unix seconds
}

export type BGPPCity = {
	city: string;
	center: Coords;
	timezone: string;
	stations: StationSource;
	live?: LiveSource;
	schedule?: ScheduleSource;
};