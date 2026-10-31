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