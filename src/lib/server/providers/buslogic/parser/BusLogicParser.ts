import type { AllStationsResponse, Arrival, Line, Station } from "$lib/shared/types";
import { defaultHash } from "$lib/server/hash";
import type { LiveParser, StationParser } from "$lib/server/ports";

export class BusLogicParser implements StationParser<any>, LiveParser<any> {

    private parseStation(value: any) : Station {
        const stationWithoutHash = {
            name: value.name,
            uid: value.id,
            id: value.station_id,
            coords: { lat: Number(value.coordinates.latitude), lon: Number(value.coordinates.longitude) },
        };

        const hash = defaultHash(JSON.stringify(stationWithoutHash));
        
        return { ...stationWithoutHash, hash };

    }

    parseStations(response: any): AllStationsResponse {
        return response.stations.reduce(
			(acc: AllStationsResponse, value: any) => {
				const station = this.parseStation(value);
				return { ...acc, [station.id.toUpperCase()]: station };
			},
			{}
		);
    }
    parseLive(response: any): Line[] {
        if (response.length == 0 || response[0].just_coordinates == "1") return [];
        const linesMap = response.toReversed().reduce((map: Map<string, Line>, value: any) => {
            const arrival: Arrival = {
                etaSeconds: value.seconds_left ?? 0,
                etaStations: value.stations_between ?? 0,
                stationName: value.vehicles[0].station_name ?? 'Unknown',
                garageNo: value.vehicles[0].garageNo ?? 'Unknown',
                coords: { lat: Number(value.vehicles[0].lat ?? '0'), lon: Number(value.vehicles[0].lng ?? '0') },
            };
    
            if (map.has(value.line_number)) {
                map.get(value.line_number)!.arrivals.push(arrival);
            } else {
                map.set(value.line_number, {
                    lineNumber: value.line_number,
                    lineName: value.line_title,
                    arrivals: [arrival],
                });
            }
    
            return map;
        }, new Map<string, Line>());
    
        return Array.from(linesMap.values());
    }
}