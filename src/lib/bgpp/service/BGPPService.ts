import type { AllStationsResponse, BGPPCity, CityID, Line, Station } from '$lib/types';
import { Cached } from '$lib/cache/Cached';
import type { NodeCacheStore } from '@cacheable/node-cache';

export class BGPPService {
	private readonly cache: NodeCacheStore<any>;
    private busLogicInstances: Record<CityID, BGPPCity>;

	@Cached<[CityID], AllStationsResponse>({
		key: (city: CityID) => `${city}_ALL_STATIONS`,
		ttl: '1d'
	})
	async getAllStations(city: string): Promise<AllStationsResponse> {
		const instance = this.busLogicInstances[city];
		if (!instance) {
			throw new Error(`City ${city} is not supported`);
		}
		const stations = await instance.repo.getAllStations();
        const parsed = instance.parser.parseAllStations(stations);
        return parsed;
	}

    @Cached<[CityID, Station], Line[]>({
		key: (city: CityID, station: Station) => `${city}_ARRIVALS_${station.id}`,
		ttl: '15s'
	})
    async getStationLiveArrivals(city: CityID, station: Station): Promise<Line[]> {
        const instance = this.busLogicInstances[city];
        if (!instance) {
            throw new Error(`City ${city} is not supported`);
        }
        const arrivals = await instance.repo.getStationLiveArrivals(station.uid);
        const parsed = instance.parser.parseStationLiveArrivals(arrivals);
        return parsed;
    }

	constructor(cache: NodeCacheStore<any>, busLogicInstances?: Record<CityID, BGPPCity>) {
		this.cache = cache;
		this.busLogicInstances = busLogicInstances ?? {};
	}

    isCitySupported(city: CityID): boolean {
        return !!this.busLogicInstances[city];
    }
}
