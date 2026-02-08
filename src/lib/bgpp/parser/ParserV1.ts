import type { IParser } from './IParser';
import type { AllStationsResponse, Arrival, Line, Station } from '../../types';
import { defaultHash } from '$lib/utils/hash';
import dayjs from "dayjs";


/**
 * Parser v1
 * Compatible with BusLogicV1 and BusLogicV2
 */
export class ParserV1 implements IParser {
	private parseStation(value: any): Station {
		const stationWithoutHash = {
			name: value.name,
			uid: value.id,
			id: value.station_id,
			coords: { lat: Number(value.coordinates.latitude), lon: Number(value.coordinates.longitude) }
		};

		const hash = defaultHash(JSON.stringify(stationWithoutHash));

		return { ...stationWithoutHash, hash };
	}

	parseAllStations(response: any): AllStationsResponse {
		return response.stations.reduce((acc: AllStationsResponse, value: any) => {
			const station = this.parseStation(value);
			return { ...acc, [station.id.toUpperCase()]: station };
		}, {});
	}
	parseStationLiveArrivals(response: any): Line[] {
		if (response.length == 0 || response[0].just_coordinates == '1') return [];
		const linesMap = response.toReversed().reduce((map: Map<string, Line>, value: any) => {
			const arrival: Arrival = {
				etaSeconds: value.seconds_left ?? 0,
				etaStations: value.stations_between ?? 0,
				stationName: value.vehicles[0].station_name ?? 'Unknown',
				garageNo: value.vehicles[0].garageNo ?? 'Unknown',
				coords: {
					lat: Number(value.vehicles[0].lat ?? '0'),
					lon: Number(value.vehicles[0].lng ?? '0')
				}
			};

			if (map.has(value.line_number)) {
				map.get(value.line_number)!.arrivals.push(arrival);
			} else {
				map.set(value.line_number, {
					lineNumber: value.line_number,
					lineName: value.line_title,
					arrivals: [arrival]
				});
			}

			return map;
		}, new Map<string, Line>());

		return Array.from(linesMap.values());
	}

	parseStationLineTimetable(response: any, date: string) : number[] {
		return (response.departure_time as string[]).map((time: string) => {
			const tomorrow = time.includes('(+24h)');
			const timeWithoutSuffix = time.replace('(+24h)', '').trim();
			const timestamp = dayjs(`${date} ${timeWithoutSuffix}`)
				.add(tomorrow ? 1 : 0, 'day')
				.unix();
			return timestamp;
		}).filter((timestamp: number) => timestamp > dayjs().add(-1, 'minute').unix()); // filter out departures that have already left (with a 1 minute buffer)
	}

    parseLineTimetable(response: any[], date: string, uidToIdMap: Record<string, string>): Record<string, number[]> {
        return response.reduce((acc: Record<string, number[]>, entry: any) => {
            const stationId = uidToIdMap[entry.station_uid];
            if (!stationId) return acc;

            const departureTimes = this.parseStationLineTimetable(entry, date);
            return { ...acc, [stationId]: departureTimes };
        });
    }
}
