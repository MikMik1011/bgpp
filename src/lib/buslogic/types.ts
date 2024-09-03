export interface AllStationsResponse {
    [stationId: string]: Station;
}
export interface Station {
    name: string;
    uid: string;
    id: string;
    coords: Coords;
}

export interface Line {
    lineNumber: string;
    lineName: string;
    arrivals: Arrival[];
}

export interface Arrival {
    secondsLeft: number;
    stationsBetween: number;
    stationName: string;
    garageNo: string;
    coords: Coords;
}

export interface Coords {
    lat: number;
    lon: number;
}

export interface BusLogicAPIParams {
    city: string;
    baseUrl: string;
    apiKey: string;
}

export interface BusLogicAPIV2Params extends BusLogicAPIParams {
    encKey: string;
    encIV: string;
}