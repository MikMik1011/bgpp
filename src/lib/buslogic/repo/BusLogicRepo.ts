import type { BusLogicRepoParams } from "../../types";

export abstract class BusLogicRepo {

    protected _baseUrl: string;
    protected _apiKey: string;

    abstract getAllStations(): Promise<any>;
    abstract getStationLiveArrivals(stationUid: string): Promise<any>;

    constructor ({baseUrl, apiKey} : BusLogicRepoParams) {
        this._baseUrl = baseUrl;
        this._apiKey = apiKey;
    };
}

