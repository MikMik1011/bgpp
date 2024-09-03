import type { IParser } from "./IParser";
import type { AllStationsResponse, Arrival, Line, Station } from "../types";

/**
 * Parser v1
 * Compatible with BusLogicV1 and BusLogicV2
 */
export class ParserV1 implements IParser {
    parseAllStations(response: any): AllStationsResponse {
        return response.stations.reduce(
			(acc: AllStationsResponse, value: any) => {
				const station: Station = {
					name: value.name,
					uid: value.id,
					id: value.station_id,
					coords: { lat: value.coordinates.latitude, lon: value.coordinates.longitude }
				};

				return { ...acc, [station.uid]: station };
			},
			{}
		);
    }
    parseStationArrivals(response: any): Line[] {
        if (response.length == 0 || response[0].just_coordinates == "1") return [];
        const linesMap = response.toReversed().reduce((map: Map<string, Line>, value: any) => {
            const arrival: Arrival = {
                secondsLeft: value.seconds_left,
                stationsBetween: value.stations_between,
                stationName: value.vehicles[0].station_name,
                garageNo: value.vehicles[0].garageNo,
                coords: { lat: value.vehicles[0].lat, lon: value.vehicles[0].lng },
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