import type { AllStationsResponse, Line } from '../../types';
import type { IParser } from './IParser';
import { ParserV1 } from './ParserV1';

/**
 * Parser v2
 * Compatible with BusLogicV2
 * As of now, it's identical to ParserV1
 */
export class ParserV2 extends ParserV1 implements IParser {
	parseAllStations(response: any): AllStationsResponse {
		return super.parseAllStations(response);
	}
	parseStationLiveArrivals(response: any): Line[] {
		return super.parseStationLiveArrivals(response);
	}
	parseStationLineTimetable(response: any, date: string): number[] {
		return super.parseStationLineTimetable(response, date);
	}
	parseLineTimetable(
		response: any[],
		date: string,
		uidToIdMap: Record<string, string>
	): Record<string, number[]> {
		return super.parseLineTimetable(response, date, uidToIdMap);
	}
}
