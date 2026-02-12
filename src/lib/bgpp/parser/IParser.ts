import type { AllStationsResponse, Line } from "../../types";

export interface IParser {
    parseAllStations(response: any): AllStationsResponse;
    parseStationLiveArrivals(response: any): Line[];
    parseStationLineTimetable(response: any, date: string) : number[];
    parseLineTimetable(response: any[], date: string, uidToIdMap: Record<string, string>): Record<string, number[]>
}