import type { BusLogicRepo } from './repo/BusLogicRepo';
import type { IParser } from './parser/IParser';
import type { AllStationsResponse, Line, Station } from '$lib/shared/types';
import type { LiveSource, StationSource } from '$lib/server/ports';

export class BusLogicSource implements StationSource, LiveSource {
	constructor(
		private readonly repo: BusLogicRepo,
		private readonly parser: IParser
	) {}

	async getStations(): Promise<AllStationsResponse> {
		return this.parser.parseAllStations(await this.repo.getAllStations());
	}

	async getLiveArrivals(station: Station): Promise<Line[]> {
		return this.parser.parseStationLiveArrivals(await this.repo.getStationLiveArrivals(station.uid));
	}
}