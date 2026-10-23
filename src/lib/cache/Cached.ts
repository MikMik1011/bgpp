import type { NodeCacheStore } from "@cacheable/node-cache";

type Entry<T> = { v: T; t: number };

const UNITS: Record<string, number> = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };

function toMs(shorthand: string): number {
	const match = /^(\d+)\s*([smhd])$/.exec(shorthand.trim());
	if (!match) {
		throw new Error(`Invalid duration "${shorthand}", expected e.g. "15s", "5m", "1h", "1d"`);
	}
	return Number(match[1]) * UNITS[match[2]];
}

// Concurrent calls for the same key share one underlying call, so a cold or expired entry
// triggers a single upstream fetch instead of one per waiting request.
const inFlight = new WeakMap<object, Map<string, Promise<unknown>>>();

/**
 * A decorator function that caches the result of an asynchronous method.
 * The cache is keyed based on the provided `key` function and stored with a specified time-to-live (TTL).
 * Concurrent calls for the same key are coalesced into a single call to the underlying method.
 *
 * @template TArgs - The type of the arguments passed to the decorated method.
 * @template TResult - The type of the result returned by the decorated method.
 *
 * @param opts - Configuration options for the cache.
 * @param opts.key - A function that generates a unique cache key based on the method arguments.
 * @param opts.ttl - How long the cached value is considered fresh, as a shorthand string ("15s", "5m", "1h", "1d").
 * @param opts.staleWhileRevalidate - Opt-in. Once the value is older than `ttl`, keep serving it for up to this
 * much longer (same shorthand) while refreshing it in the background, so callers never wait on the refresh.
 * If the background refresh fails the stale value keeps being served until this window ends.
 * Leave unset for data that must be live: expired values are then refetched before responding.
 *
 * @returns A method decorator that caches the result of the decorated method.
 *
 * @throws Will throw an error if the `cache` property is not available on the instance.
 */
export function Cached<TArgs extends any[], TResult>(opts: {
	key: (...args: TArgs) => string;
	ttl: string;
	staleWhileRevalidate?: string;
}) {
	const ttlMs = toMs(opts.ttl);
	const staleMs = opts.staleWhileRevalidate ? toMs(opts.staleWhileRevalidate) : 0;
	const storeTtl = `${Math.ceil((ttlMs + staleMs) / 1000)}s`;

	return function (
		_target: any,
		_propertyKey: string,
		descriptor: TypedPropertyDescriptor<(...args: TArgs) => Promise<TResult>>
	): void {
		const original = descriptor.value!;

		descriptor.value = async function (this: { cache: any }, ...args: TArgs): Promise<TResult> {
			const cache = this.cache as NodeCacheStore<any>;
			if (!cache) {
				throw new Error('Cache not available on instance');
			}

			const cacheKey = opts.key(...args);

			const refresh = (): Promise<TResult> => {
				let pending = inFlight.get(this);
				if (!pending) {
					pending = new Map();
					inFlight.set(this, pending);
				}
				const running = pending.get(cacheKey);
				if (running) return running as Promise<TResult>;

				const promise = (async () => {
					const result = await original.apply(this, args);
					const entry: Entry<TResult> = { v: result, t: Date.now() };
					await cache.set(cacheKey, JSON.stringify(entry), storeTtl as unknown as number); // hack to use shorthands
					return result;
				})().finally(() => pending.delete(cacheKey));
				pending.set(cacheKey, promise);
				return promise;
			};

			const cached = await cache.get(cacheKey);
			if (cached !== undefined) {
				const entry = JSON.parse(cached as string) as Entry<TResult>;
				const age = Date.now() - entry.t;
				if (age < ttlMs) {
					return entry.v;
				}
				if (age < ttlMs + staleMs) {
					refresh().catch((err) => console.error(`Background refresh of ${cacheKey} failed:`, err));
					return entry.v;
				}
			}

			return refresh();
		};
	};
}
