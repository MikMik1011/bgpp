import { BusLogicRepo } from './BusLogicRepo';
import type { BusLogicRepoV2Params } from '../../types';
import crypto from 'crypto';
import JSZip from 'jszip';

const endpoints = {
	allStationsZip: '/publicapi/v1/networkextended.php?ibfm=TM000001&action=get_cities_extended_zip',
	allStationsDB: '/publicapi/v1/networkextended.php?ibfm=TM000001&action=get_cities_extended',
	timetable: '/publicapi/v1/timetable/timetable.php',
	stationInfo: '/publicapi/v2/api.php'
};

const userAgent = 'okhttp/4.10.0';

type ArrivalsPayload = {
	station_uid: string;
	session_id: string;
};

export class BusLogicRepoV2 extends BusLogicRepo {
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

	private readonly encryption: {
		key: Buffer;
		iv: Buffer;
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
		const payload: ArrivalsPayload = {
			station_uid: stationUid,
			session_id: `A${Date.now()}`
		};
		const encrypted = this.encrypt(payload);
		const res = await fetch(this.urls.stationInfo, {
			method: 'POST',
			headers: this.headers,
			body: new URLSearchParams({
				action: 'data_bulletin',
				base: encrypted
			})
		});

		if (!res.ok) {
			throw new Error(`Failed to fetch all arrivals: ${res.statusText}`);
		}
		return this.decrypt(await res.text())?.data;
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

	encrypt(payload: ArrivalsPayload): string {
		const payloadString = JSON.stringify(payload);

		const cipher = crypto.createCipheriv(
			'aes-256-cbc',
			new Uint8Array(this.encryption.key),
			new Uint8Array(this.encryption.iv)
		);
		const encrypted = cipher.update(payloadString, 'utf8', 'base64') + cipher.final('base64');
		return encrypted;
	}

	decrypt(encrypted: string): any {
		const urlDecoded = decodeURIComponent(encrypted);

		const decipher = crypto.createDecipheriv(
			'aes-256-cbc',
			new Uint8Array(this.encryption.key),
			new Uint8Array(this.encryption.iv)
		);
		const decrypted = decipher.update(urlDecoded, 'base64', 'utf8') + decipher.final('utf8');

		return JSON.parse(decrypted);
	}

	constructor({ baseUrl, apiKey, encKey, encIV }: BusLogicRepoV2Params) {
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

		this.encryption = {
			key: Buffer.from(encKey, 'base64'),
			iv: Buffer.from(encIV, 'base64')
		};
	}
}
