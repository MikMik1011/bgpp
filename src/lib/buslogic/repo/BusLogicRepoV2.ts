import { BusLogicRepo } from './BusLogicRepo';
import type { BusLogicRepoV2Params } from '../../types';
import crypto from 'crypto';

const endpoints = {
	allStations: '/publicapi/v1/networkextended.php',
	stationInfo: '/publicapi/v2/api.php'
};

const userAgent = 'okhttp/4.10.0';

type ArrivalsPayload = {
	station_uid: string;
	session_id: string;
};

export class BusLogicRepoV2 extends BusLogicRepo {
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
