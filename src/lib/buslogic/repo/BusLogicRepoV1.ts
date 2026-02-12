import { BusLogicRepo } from './BusLogicRepo';
import type { BusLogicRepoParams } from '../../types';
import JSZip from 'jszip';

const endpoints = {
	allStationsZip: '/publicapi/v1/networkextended.php?ibfm=TM000001&action=get_cities_extended_zip',
	allStationsDB: '/publicapi/v1/networkextended.php?ibfm=TM000001&action=get_cities_extended',
	timetable: '/publicapi/v1/timetable/timetable.php',
	stationInfo:
		'/publicapi/v1/announcement/announcement.php?ibfm=TM000001&action=get_announcement_data&station_uid='
};

const userAgent = 'okhttp/4.10.0';

export class BusLogicRepoV1 extends BusLogicRepo {
	private readonly urls: {
		readonly allStationsZip: string;
		readonly allStationsDB: string;
		readonly timetable: string;
		readonly stationInfo: string;
	};

	private readonly headers: {
		'X-Api-Authentication': string;
		'User-Agent': string;
	};

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

	async getAllStations(): Promise<any> {
		try {
			return this.getAllStationsResponseZip();
		} catch (error) {
			return this.getAllStationsResponseDB();
		}
	}

	async getStationLiveArrivals(stationUid: string): Promise<any> {
		const res = await fetch(this.urls.stationInfo + stationUid, { headers: this.headers });
		if (!res.ok) {
			throw new Error(`Failed to fetch all arrivals: ${res.statusText}`);
		}
		return res.json();
	}

	async getLineTimetable(
		lineNumber: string,
		direction: string,
		date: string,
		time?: string
	): Promise<any[]> {
		const body = new URLSearchParams({
			action: 'get_timetable',
			line_number_for_display: lineNumber,
			direction_id_for_display: direction,
			date,
			time: time ?? ''
		});

		const res = await fetch(this.urls.timetable, {
			method: 'POST',
			headers: this.headers,
			body
		});
		if (!res.ok) {
			throw new Error(`Failed to fetch timetable: ${res.statusText}`);
		}
		return res.json();
	}

	constructor({ baseUrl, apiKey }: BusLogicRepoParams) {
		super({ baseUrl, apiKey });
		this.urls = {
			allStationsZip: this._baseUrl + endpoints.allStationsZip,
			allStationsDB: this._baseUrl + endpoints.allStationsDB,
			timetable: this._baseUrl + endpoints.timetable,
			stationInfo: this._baseUrl + endpoints.stationInfo
		};
		this.headers = {
			'X-Api-Authentication': apiKey,
			'User-Agent': userAgent
		};
	}
}
