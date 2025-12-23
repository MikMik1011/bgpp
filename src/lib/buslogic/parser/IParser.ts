import type { AllStationsResponse, Line } from "./types";

export interface IParser {
    parseAllStations(response: any): AllStationsResponse;
    parseStationLiveArrivals(response: any): Line[];
}