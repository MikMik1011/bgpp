import { LocalTimedCache } from "./LocalTimedCache";
import type { ITimedCache } from "./ITimedCache";

type CachedFunctionData<T> = {
    func: (...args: any[]) => Promise<T>;
    args: any[];
}

export class CachedFunctionRunner<T> {
    private cacheProvider: ITimedCache<T>;
    private functionMap = new Map<string, CachedFunctionData<T>>();

    constructor(cacheProvider: ITimedCache<T>) {
        this.cacheProvider = cacheProvider;
    }

    public async addFunction(key: string, func: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
        if (typeof func !== 'function') {
            throw new Error(`Provided func is not a function`);
        }
        this.functionMap.set(key, { func, args });
        return this.run(key);
    }

    public hasFunction(key: string): boolean {
        return this.functionMap.has(key);
    }

    public async get(key: string): Promise<T> {
        try {
            return await this.cacheProvider.get(key);
        } catch (error) {
            return await this.run(key);
        }
    }

    public async run(key: string): Promise<T> {
        const data = this.functionMap.get(key);
        if (!data) {
            throw new Error(`Function with key ${key} not found`);
        }

        const result = await data.func(...data.args);
        this.cacheProvider.set(key, result);
        return result;
    }
}