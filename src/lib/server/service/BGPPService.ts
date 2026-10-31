import type { AllStationsResponse, CityID, Line, Station } from '$lib/shared/types';
import type { BGPPCity } from '$lib/server/ports';
import { Cached } from '$lib/server/cache/Cached';
import type { NodeCacheStore } from '@cacheable/node-cache';

export class BGPPService {
	private readonly cache: NodeCacheStore<any>;
    private cities: Record<CityID, BGPPCity>;

	@Cached<[CityID], AllStationsResponse>({
		key: (city: CityID) => `${city}_ALL_STATIONS`,
		ttl: '1d',
		staleWhileRevalidate: '7d' // stations rarely change, so serve the old list while refreshing it
	})
	async getAllStations(city: string): Promise<AllStationsResponse> {
		const instance = this.cities[city];
		if (!instance) throw new Error(`City ${city} is not supported`);
		return instance.stations.getStations();
	}

    @Cached<[CityID, Station], Line[]>({
		key: (city: CityID, station: Station) => `${city}_ARRIVALS_${station.id}`,
		ttl: '15s'
	})
    async getStationLiveArrivals(city: CityID, station: Station): Promise<Line[]> {
        const instance = this.cities[city];
		if (!instance) throw new Error(`City ${city} is not supported`);
		if (!instance.live) return [];
		return instance.live.getLiveArrivals(station);
    }

	constructor(cache: NodeCacheStore<any>, cities?: Record<CityID, BGPPCity>) {
		this.cache = cache;
		this.cities = cities ?? {};
		for (const [id, c] of Object.entries(this.cities)) {
			if (!c.live && !c.schedule) throw new Error(`City ${id} has neither live nor schedule data`);
		}
	}

    isCitySupported(city: CityID): boolean {
        return !!this.cities[city];
    }
}
