import type { Coords, Line, Station } from './types';

export type City = {
	id: string;
	name: string;
	center: Coords;
};

export type ArrivalsResponse = {
	station: Station;
	lines: Line[];
};
