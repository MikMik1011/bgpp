import { BusLogicAPI } from './BusLogicAPI';
import type { IParser } from '../parser/IParser';
import type { AllStationsResponse, Station, Line, BusLogicAPIV2Params } from '../types';
import crypto from 'crypto';
import { ParserV2 } from '../parser/ParserV2';

const endpoints = {
	allStations: '/publicapi/v1/networkextended.php?action=get_cities_extended',
	stationInfo: '/publicapi/v2/api.php'
};

const userAgent = 'okhttp/4.10.0';

type ArrivalsPayload = {
	station_uid: string;
	session_id: string;
}

export class BusLogicAPIV2 extends BusLogicAPI {
	private readonly urls: {
		readonly allStations: string;
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

	async getAllStations(): Promise<AllStationsResponse> {
		const res = await fetch(this.urls.allStations, { headers: this.headers });
		if (!res.ok) {
			throw new Error(`Failed to fetch all stations: ${res.statusText}`);
		}

		const json = await res.json();
		return this.parser.parseAllStations(json);
	}

	async getStationArrivals(station: Station): Promise<Line[]> {
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
		return this.parser.parseStationArrivals(json.data);
	}

	encrypt(payload: ArrivalsPayload): string {
		const payloadString = JSON.stringify(payload);

		const cipher = crypto.createCipheriv('aes-256-cbc', this.encryption.key, this.encryption.iv);
		const encrypted = cipher.update(payloadString, 'utf8', 'base64') + cipher.final('base64');
		return encrypted;
	}

	decrypt(encrypted: string): any {
		const urlDecoded = decodeURIComponent(encrypted);

		const decipher = crypto.createDecipheriv(
			'aes-256-cbc',
			this.encryption.key,
			this.encryption.iv
		);
		const decrypted = decipher.update(urlDecoded, 'base64', 'utf8') + decipher.final('utf8');

		return JSON.parse(decrypted);
	}

	constructor({city, baseUrl, apiKey, encKey, encIV} : BusLogicAPIV2Params) {
		super({city, baseUrl, apiKey});

		this.urls = {
			allStations: this._baseUrl + endpoints.allStations,
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
