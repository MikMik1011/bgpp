import { BusLogicAPI } from './BusLogicAPI';
import type { IParser } from '../parser/IParser';
import type { AllStationsResponse, Station, Line, BusLogicAPIV2Params } from '../types';
import crypto from 'crypto';
import { ParserV2 } from '../parser/ParserV2';
import JSZip from 'jszip';
import type { NodeCacheStore } from '@cacheable/node-cache';
import { Cached } from '$lib/cache/Cached';

const endpoints = {
	allStationsZip: '/publicapi/v1/networkextended.php?ibfm=TM000001&action=get_cities_extended_zip',
	allStationsDB: '/publicapi/v1/networkextended.php?ibfm=TM000001&action=get_cities_extended',
	stationInfo: '/publicapi/v2/api.php'
};

const userAgent = 'okhttp/4.10.0';

type ArrivalsPayload = {
	station_uid: string;
	session_id: string;
};

export class BusLogicAPIV2 extends BusLogicAPI {
	private readonly urls: {
		readonly allStationsZip: string;
		readonly allStationsDB: string;
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

	protected parser: IParser = new ParserV2();

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
		const payload: ArrivalsPayload = {
			station_uid: station.uid,
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
		const json = this.decrypt(await res.text());
		return this.parser.parseStationLiveArrivals(json.data);
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

	constructor(
		{ city, baseUrl, apiKey, encKey, encIV }: BusLogicAPIV2Params,
		cache?: NodeCacheStore<any>
	) {
		super({ city, baseUrl, apiKey }, cache);

		this.urls = {
			allStationsZip: this._baseUrl + endpoints.allStationsZip,
			allStationsDB: this._baseUrl + endpoints.allStationsDB,
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
