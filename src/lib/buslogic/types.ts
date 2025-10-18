export type AllStationsResponse = {
    [stationId: string]: Station;
}
export type Station =  {
    name: string;
    uid: string;
    id: string;
    coords: Coords;
    hash: string;
}

export type Line = {
    lineNumber: string;
    lineName: string;
    arrivals: Arrival[];
}

export type Arrival = {
    etaSeconds: number;
    etaStations: number;
    stationName?: string;
    garageNo: string;
    coords: Coords;
};

export type Coords = {
    lat: number;
    lon: number;
}

export type BusLogicAPIParams = {
    city: string;
    baseUrl: string;
    apiKey: string;
}

export type BusLogicAPIV2Params = BusLogicAPIParams & {
    encKey: string;
    encIV: string;
}