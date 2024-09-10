import type { ITimedCache } from "./ITimedCache";

interface CacheEntry<T> {
	value: T;
	expires: number;
}

export class LocalTimedCache<T> implements ITimedCache<T> {
	private cache: Map<string, CacheEntry<T>> = new Map();
	private readonly ttl: number;

	constructor(ttl: number) {
		this.ttl = ttl;
	}

	public async get(key: string): Promise<T> {
		const entry = this.cache.get(key);
		if (entry) {
			if (entry.expires > Date.now()) {
				return entry.value;
			} else {
				this.cache.delete(key);
			}
		}
		return Promise.reject(undefined);
	}

	public set(key: string, value: T): void {
		this.cache.set(key, { value, expires: Date.now() + this.ttl });
	}

	public clear(): void {
		this.cache.clear();
	}
}
