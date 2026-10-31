import type { AllStationsResponse, Line } from "$lib/shared/types";

export interface IParser {
    parseAllStations(response: any): AllStationsResponse;
    parseStationLiveArrivals(response: any): Line[];
}