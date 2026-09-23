import { BusLogicRepo } from './BusLogicRepo';
import type { BusLogicRepoParams } from '../../types';

const endpoints = {
	allStations: '/publicapi/v1/networkextended.php',
	stationInfo:
		'/publicapi/v1/announcement/announcement.php?ibfm=TM000001&action=get_announcement_data&station_uid='
};

const userAgent = 'okhttp/4.10.0';

export class BusLogicRepoV1 extends BusLogicRepo {
	private readonly urls: {
		readonly allStations: string;
		readonly stationInfo: string;
	};

	private readonly headers: {
		'X-Api-Authentication': string;
		'User-Agent': string;
	};

	async getAllStations(): Promise<any> {
		const res = await fetch(this.urls.allStations, {
			method: 'POST',
			headers: { ...this.headers, 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'get_cities_extended' })
		});
		if (!res.ok) {
			throw new Error(`Failed to fetch all stations: ${res.statusText}`);
		}
		return res.json();
	}

	async getStationLiveArrivals(stationUid: string): Promise<any> {
		const res = await fetch(this.urls.stationInfo + stationUid, { headers: this.headers });
		if (!res.ok) {
			throw new Error(`Failed to fetch all arrivals: ${res.statusText}`);
		}
		return res.json();
	}

	constructor({baseUrl, apiKey} : BusLogicRepoParams) {
		super({baseUrl, apiKey});
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
