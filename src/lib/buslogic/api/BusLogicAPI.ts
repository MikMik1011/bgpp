import { NodeCacheStore } from "@cacheable/node-cache";
import type { IParser } from "../parser/IParser";
import type { AllStationsResponse, BusLogicAPIParams, Line, Station } from "../types";

export abstract class BusLogicAPI {

    protected _city: string;
    protected _baseUrl: string;
    protected _apiKey: string;
    protected readonly cache: NodeCacheStore<any>;
    protected readonly abstract parser: IParser;

    abstract getAllStations(): Promise<AllStationsResponse>;
    abstract getStationLiveArrivals(station: Station): Promise<Line[]>;

    constructor ({city, baseUrl, apiKey} : BusLogicAPIParams, cache? : NodeCacheStore<any>) {
        this._city = city;
        this._baseUrl = baseUrl;
        this._apiKey = apiKey;
        this.cache = cache ?? new NodeCacheStore();
    };

    public get city(): string {
        return this._city;
    }
}

