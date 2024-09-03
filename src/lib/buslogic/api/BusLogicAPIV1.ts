import { BusLogicAPI } from './BusLogicAPI';
import type { IParser } from '../parser/IParser';
import { ParserV1 } from '../parser/ParserV1';
import type { AllStationsResponse, Station, Line, BusLogicAPIParams } from '../types';

const endpoints = {
	allStations: '/publicapi/v1/networkextended.php?action=get_cities_extended',
	stationInfo:
		'/publicapi/v1/announcement/announcement.php?action=get_announcement_data&station_uid='
};

const userAgent = 'okhttp/4.10.0';

export class BusLogicAPIV1 extends BusLogicAPI {
	private readonly urls: {
		readonly allStations: string;
		readonly stationInfo: string;
	};

	private readonly headers: {
		'X-Api-Authentication': string;
		'User-Agent': string;
	};
	protected parser: IParser = new ParserV1();

	async getAllStations(): Promise<AllStationsResponse> {
		const res = await fetch(this.urls.allStations, { headers: this.headers });
		if (!res.ok) {
			throw new Error(`Failed to fetch all stations: ${res.statusText}`);
		}

		const json = await res.json();
		return this.parser.parseAllStations(json);
	}

	async getStationArrivals(station: Station): Promise<Line[]> {
		const res = await fetch(this.urls.stationInfo + station.uid, { headers: this.headers });
		if (!res.ok) {
			throw new Error(`Failed to fetch all arrivals: ${res.statusText}`);
		}

		const json = await res.json();
		return this.parser.parseStationArrivals(json);
	}

	constructor({city, baseUrl, apiKey} : BusLogicAPIParams) {
		super({city, baseUrl, apiKey});
		this.urls = {
			allStations: this._baseUrl + endpoints.allStations,
			stationInfo: this._baseUrl + endpoints.stationInfo
		};
		this.headers = {
			'X-Api-Authentication': apiKey,
			'User-Agent': userAgent
		};
	}
}
