import type { IParser } from "../parser/IParser";
import type { AllStationsResponse, Line, Station } from "../types";

export abstract class BusLogicAPI {

    protected _city: string;
    protected _baseUrl: string;
    protected _apiKey: string;
    protected readonly abstract parser: IParser;

    abstract getAllStations(): Promise<AllStationsResponse>;
    abstract getStationArrivals(station: Station): Promise<Line[]>;

    constructor (city: string, baseUrl: string, apiKey: string) {
        this._city = city;
        this._baseUrl = baseUrl;
        this._apiKey = apiKey;
    };

    public get city(): string {
        return this._city;
    }
}

