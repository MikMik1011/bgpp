import type { AllStationsResponse, Line } from "../..types";

export interface IParser {
    parseAllStations(response: any): AllStationsResponse;
    parseStationLiveArrivals(response: any): Line[];
    parseStationLineTimetable(response: any, day: string) : number[];
    parseLineTimetable(response: any[], day: string, uidToIdMap: Record<string, string>): Record<string, number[]>
}