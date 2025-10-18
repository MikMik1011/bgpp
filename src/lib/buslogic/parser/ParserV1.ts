import type { IParser } from "./IParser";
import type { AllStationsResponse, Arrival, Line, Station } from "../types";
import { defaultHash } from "$lib/utils/hash";

/**
 * Parser v1
 * Compatible with BusLogicV1 and BusLogicV2
 */
export class ParserV1 implements IParser {

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

    parseAllStations(response: any): AllStationsResponse {
        return response.stations.reduce(
			(acc: AllStationsResponse, value: any) => {
				const station = this.parseStation(value);
				return { ...acc, [station.id.toUpperCase()]: station };
			},
			{}
		);
    }
    parseStationArrivals(response: any): Line[] {
        if (response.length == 0 || response[0].just_coordinates == "1") return [];
        const linesMap = response.toReversed().reduce((map: Map<string, Line>, value: any) => {
            const arrival: Arrival = {
                etaSeconds: value.seconds_left,
                etaStations: value.stations_between,
                stationName: value.vehicles[0].station_name,
                garageNo: value.vehicles[0].garageNo,
                coords: { lat: Number(value.vehicles[0].lat), lon: Number(value.vehicles[0].lng) },
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