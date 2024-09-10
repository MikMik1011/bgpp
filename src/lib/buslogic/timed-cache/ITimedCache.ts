export interface ITimedCache<T> {
	get(key: string): Promise<T>;
	set(key: string, value: T): void;
	clear(): void;
}
