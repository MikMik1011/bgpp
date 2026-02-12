import type { BusLogicRepo } from "./buslogic/repo/BusLogicRepo";
import type { IParser } from "./bgpp/parser/IParser";

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

export type BusLogicRepoParams = {
    baseUrl: string;
    apiKey: string;
}

export type BusLogicRepoV2Params = BusLogicRepoParams & {
    encKey: string;
    encIV: string;
}

export type BusLogicLine = {
    number: string;
    direction: string;
}

export type BGPPCity = {
    city: string,
    center: Coords,
    repo: BusLogicRepo,
    parser: IParser
}

export type CityID = string;

export type BGPPLine = {
    line: string;
    direction: string;
}

export type BGPPLineData = BGPPLine & {
    stations: string[];
}