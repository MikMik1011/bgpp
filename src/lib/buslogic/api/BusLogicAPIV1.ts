import { BusLogicAPI } from './BusLogicAPI';
import type { IParser } from '../parser/IParser';
import { ParserV1 } from '../parser/ParserV1';
import type { AllStationsResponse, Station, Line, BusLogicAPIParams } from '../types';
import JSZip from 'jszip';
import type { NodeCacheStore } from '@cacheable/node-cache';
import { Cached } from '$lib/cache/Cached';

const endpoints = {
	allStationsZip: '/publicapi/v1/networkextended.php?ibfm=TM000001&action=get_cities_extended_zip',
	allStationsDB: '/publicapi/v1/networkextended.php?ibfm=TM000001&action=get_cities_extended',
	stationInfo:
		'/publicapi/v1/announcement/announcement.php?ibfm=TM000001&action=get_announcement_data&station_uid='
};

const userAgent = 'okhttp/4.10.0';

export class BusLogicAPIV1 extends BusLogicAPI {
	private readonly urls: {
		readonly allStationsZip: string;
		readonly allStationsDB: string;
		readonly stationInfo: string;
	};

	private readonly headers: {
		'X-Api-Authentication': string;
		'User-Agent': string;
	};
	protected parser: IParser = new ParserV1();

	private async getAllStationsResponseZip(): Promise<any> {
		const res = await fetch(this.urls.allStationsZip, { headers: this.headers });
		if (!res.ok) {
			throw new Error(`Failed to fetch all stations: ${res.statusText}`);
		}
		
		const blob = await res.blob();
		const arrayBuffer = await blob.arrayBuffer();
		const zip = await JSZip.loadAsync(arrayBuffer);
		const jsonStr = await zip.file('cities_extended.json')?.async('string');
		if (!jsonStr) {
			throw new Error('cities_extended.json not found in zip');
		}
		return JSON.parse(jsonStr);
	}

	private async getAllStationsResponseDB(): Promise<any> {
		const res = await fetch(this.urls.allStationsDB, { headers: this.headers });
		if (!res.ok) {
			throw new Error(`Failed to fetch all stations: ${res.statusText}`);
		}
		return res.json();
	}

	@Cached<[], AllStationsResponse>({
		key: () => 'ALL_STATIONS',
		ttl: '1d'
	})
	async getAllStations(): Promise<AllStationsResponse> {		
		try {
			const allStationsResponse = await this.getAllStationsResponseZip();
			return this.parser.parseAllStations(allStationsResponse);
		} catch (error) {
			const allStationsResponse = await this.getAllStationsResponseDB();
			return this.parser.parseAllStations(allStationsResponse);
		}
	}

	@Cached<[Station], Line[]>({
		key: (station: Station) => `ARRIVALS_${station.id}`,
		ttl: '15s'
	})
	async getStationLiveArrivals(station: Station): Promise<Line[]> {
		const res = await fetch(this.urls.stationInfo + station.uid, { headers: this.headers });
		if (!res.ok) {
			throw new Error(`Failed to fetch all arrivals: ${res.statusText}`);
		}
		const json = await res.json();
		const parsed = this.parser.parseStationLiveArrivals(json);
		return parsed;
	}

	constructor({city, baseUrl, apiKey} : BusLogicAPIParams, cache? : NodeCacheStore<any>) {
		super({city, baseUrl, apiKey}, cache);
		this.urls = {
			allStationsZip: this._baseUrl + endpoints.allStationsZip,
			allStationsDB: this._baseUrl + endpoints.allStationsDB,
			stationInfo: this._baseUrl + endpoints.stationInfo
		};
		this.headers = {
			'X-Api-Authentication': apiKey,
			'User-Agent': userAgent
		};
	}
}
