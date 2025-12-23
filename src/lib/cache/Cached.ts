/**
 * A decorator function that caches the result of an asynchronous method.
 * The cache is keyed based on the provided `key` function and stored with a specified time-to-live (TTL).
 *
 * @template TArgs - The type of the arguments passed to the decorated method.
 * @template TResult - The type of the result returned by the decorated method.
 *
 * @param opts - Configuration options for the cache.
 * @param opts.key - A function that generates a unique cache key based on the method arguments.
 * @param opts.ttl - The time-to-live (TTL) for the cached value, specified as a shorthand string (e.g., "1d" for 1 day, "15s" for 15 seconds).
 *
 * @returns A method decorator that caches the result of the decorated method.
 *
 * @throws Will throw an error if the `cache` property is not available on the instance.
 */
import type { NodeCacheStore } from "@cacheable/node-cache";


export function Cached<TArgs extends any[], TResult>(opts: {
	key: (...args: TArgs) => string;
	ttl: string;
}) {
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
			const cached = await cache.get(cacheKey);
			if (cached !== undefined) {
				return JSON.parse(cached as string) as TResult;
			}

			const result = await original.apply(this, args);
			await cache.set(cacheKey, JSON.stringify(result), opts.ttl as unknown as number); // hack to use shorthands
			return result;
		};
	};
}
