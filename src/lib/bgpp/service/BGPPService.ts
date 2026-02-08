import type {
	AllStationsResponse,
	BGPPCity,
	BGPPLine,
	BGPPLineData,
	CityID,
	Line,
	Station
} from '$lib/types';
import { Cached } from '$lib/cache/Cached';
import type { NodeCacheStore } from '@cacheable/node-cache';
import pLimit from 'p-limit';
import dayjs from 'dayjs';

export class BGPPService {
	private readonly cache: NodeCacheStore<any>;
	private busLogicInstances: Record<CityID, BGPPCity>;

	@Cached<[CityID], AllStationsResponse>({
		key: (city: CityID) => `${city}_ALL_STATIONS`,
		ttl: '1d'
	})
	async getAllStations(city: string): Promise<AllStationsResponse> {
		const instance = this.busLogicInstances[city];
		if (!instance) {
			throw new Error(`City ${city} is not supported`);
		}
		const stationsResponse = await instance.repo.getAllStations();
		const parsed = instance.parser.parseAllStations(stationsResponse);
		return parsed;
	}

	@Cached<[CityID, Station], Line[]>({
		key: (city: CityID, station: Station) => `${city}_ARRIVALS_${station.id}`,
		ttl: '15s'
	})
	async getStationLiveArrivals(city: CityID, station: Station): Promise<Line[]> {
		const instance = this.busLogicInstances[city];
		if (!instance) {
			throw new Error(`City ${city} is not supported`);
		}
		const arrivals = await instance.repo.getStationLiveArrivals(station.uid);
		const parsed = instance.parser.parseStationLiveArrivals(arrivals);
		return parsed;
	}

	@Cached<[CityID], BGPPLineData[]>({
		key: (city: CityID) => `${city}_ALL_LINES`,
		ttl: '1d'
	})
	async getLines(city: CityID): Promise<BGPPLineData[]> {
		const instance = this.busLogicInstances[city];
		if (!instance) {
			throw new Error(`City ${city} is not supported`);
		}

		const stationsResponse = await instance.repo.getAllStations();
		const duplicatedLines = stationsResponse.stations.flatMap(
			(station: any) => station['lines_for_station']
		) as string[];

		// gotta do all of this following stupid shit as they just give you line name and not the direction you need for getting upcoming arrivals and/or precise line routes
		const lines = Array.from(new Set(duplicatedLines));

		const today = new Date().toISOString().split('T')[0];
		const concurrencyLimit = pLimit(20);
		const uidToIdMap = await this.getUidToIdMap(city);

		const tasks = lines.flatMap((line) => {
			const directions = ['A', 'B'] as const;

			return directions.flatMap((direction) =>
				concurrencyLimit(async () => {
					try {
						const schedule = await instance.repo.getLineTimetable(line, direction, today);
						//TODO: remember todays timetable in cache
						const stations = schedule.map((s: any) => uidToIdMap[s.station_id]).filter(Boolean);
						return { line, direction, stations };
					} catch {
						return null;
					}
				})
			);
		});

		const linesData = (await Promise.all(tasks)).filter(Boolean) as BGPPLineData[];
		linesData.sort((a, b) => a.line.localeCompare(b.line));

		return linesData;
	}

	@Cached<[CityID], Record<string, BGPPLine[]>>({
		key: (city: CityID) => `${city}_STATIONS_TO_LINES`,
		ttl: '1d'
	})
	async getStationsToLineMap(city: CityID): Promise<Record<string, BGPPLine[]>> {
		const linesData = await this.getLines(city);
		const stationToLinesMap: Record<string, BGPPLine[]> = {};

		for (const lineData of linesData) {
			for (const stationId of lineData.stations) {
				if (!stationToLinesMap[stationId]) {
					stationToLinesMap[stationId] = [];
				}
				stationToLinesMap[stationId].push({
					line: lineData.line,
					direction: lineData.direction
				});
			}
		}
		return stationToLinesMap;
	}

	@Cached<[CityID], Record<string, string[]>>({
		key: (city: CityID) => `${city}_LINES_TO_STATIONS`,
		ttl: '1d'
	})
	async getLinesToStationsMap(city: CityID): Promise<Record<string, string[]>> {
		const linesData = await this.getLines(city);
		const lineToStationsMap: Record<string, string[]> = {};

		for (const lineData of linesData) {
			const lineId = `${lineData.line}|${lineData.direction}`;
			lineToStationsMap[lineId] = lineData.stations;
		}
		return lineToStationsMap;
	}

	async getLineRoute(city: CityID, line: BGPPLine): Promise<string[]> {
		const lineId = `${line.line}|${line.direction}`;
		const linesToStationsMap = await this.getLinesToStationsMap(city);
		const stations = linesToStationsMap[lineId];
		if (!stations) {
			throw new Error(
				`Line ${line.line} with direction ${line.direction} not found in city ${city}`
			);
		}

		const uidToIdMap = await this.getUidToIdMap(city);
		return stations.map((stationUid) => uidToIdMap[stationUid]);
	}

	async getStationLines(city: CityID, station: Station): Promise<BGPPLine[]> {
		const stationsToLineMap = await this.getStationsToLineMap(city);
		const lines = stationsToLineMap[station.id];
		if (!lines) {
			throw new Error(`Station ${station.id} not found in city ${city}`);
		}
		return lines;
	}

	@Cached<[CityID], Record<string, string>>({
		key: (city: CityID) => `${city}_UID_TO_ID_MAP`,
		ttl: '1d'
	})
	async getUidToIdMap(city: CityID): Promise<Record<string, string>> {
		const stations = await this.getAllStations(city);
		const uidToIdMap: Record<string, string> = {};
		for (const stationId in stations) {
			const station = stations[stationId];
			uidToIdMap[station.uid] = station.id;
		}
		return uidToIdMap;
	}

	async getStationIdFromUid(city: CityID, stationUid: string): Promise<string> {
		const uidToIdMap = await this.getUidToIdMap(city);
		const stationId = uidToIdMap[stationUid];
		if (!stationId) {
			throw new Error(`Station UID ${stationUid} not found in city ${city}`);
		}
		return stationId;
	}

	async getStationSchedule(
		city: CityID,
		station: Station,
		date?: string | null
	): Promise<Record<string, number[]>> {
		const stationLines = await this.getStationLines(city, station);
		console.log(stationLines);
		const startDay = date ? dayjs(date) : dayjs();
		const concurrencyLimit = pLimit(20);

		const tasks = stationLines.map((line) =>
			concurrencyLimit(async () => {
				try {
					const MIN_SCHEDULED_ARRIVALS = 3;
					const MAX_OFFSET_DAYS = 3;

					let parsedSchedule: number[] = [];
					let offsetDays = 0;
					while (parsedSchedule.length < MIN_SCHEDULED_ARRIVALS && offsetDays <= MAX_OFFSET_DAYS) {
						console.log(offsetDays);

						const day = startDay.add(offsetDays, 'day').format('YYYY-MM-DD');
						const schedule = await this.busLogicInstances[city].repo.getLineTimetable(
							line.line,
							line.direction,
							day
						);
						const stationSchedule = schedule.find(
							(s: any) => s.station_id === station.uid.toString()
						);
						parsedSchedule = parsedSchedule.concat(
							this.busLogicInstances[city].parser.parseStationLineTimetable(stationSchedule, day)
						);
						++offsetDays;
					}
					return {
						line: line,
						schedule: parsedSchedule
					};
				} catch (error) {
					console.error(`${line.line} errored`);
					return null;
				}
			})
		);
		const schedules = (await Promise.all(tasks)).filter(Boolean) as any[];
		return schedules.reduce((acc: Record<string, number[]>, entry) => {
			const lineId = `${entry.line.line}`;
			return { ...acc, [lineId]: entry.schedule };
		}, {});
	}

	private async seedCityCache(city: CityID): Promise<void> {
		await this.getUidToIdMap(city);

		await Promise.all([this.getStationsToLineMap(city), this.getLinesToStationsMap(city)]);
	}

	constructor(cache: NodeCacheStore<any>, busLogicInstances?: Record<CityID, BGPPCity>) {
		this.cache = cache;
		this.busLogicInstances = busLogicInstances ?? {};

		Object.keys(this.busLogicInstances).forEach((city) => {
			this.seedCityCache(city)
				.then(() => {
					console.log(`Cache seeded for city ${city}`);
				})
				.catch((err) => {
					console.error(`Failed to seed cache for city ${city}:`, err);
				});
		});
	}

	isCitySupported(city: CityID): boolean {
		return !!this.busLogicInstances[city];
	}
}
