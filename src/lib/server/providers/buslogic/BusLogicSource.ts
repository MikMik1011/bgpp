import type { BusLogicRepo } from './repo/BusLogicRepo';
import type { AllStationsResponse, Line, Station } from '$lib/shared/types';
import type { LiveParser, LiveSource, StationParser, StationSource } from '$lib/server/ports';

export class BusLogicSource implements StationSource, LiveSource {
	constructor(
		private readonly repo: BusLogicRepo,
		private readonly parser: StationParser<any> & LiveParser<any>
	) {}

	async getStations(): Promise<AllStationsResponse> {
		return this.parser.parseStations(await this.repo.getAllStations());
	}

	async getLiveArrivals(station: Station): Promise<Line[]> {
		const raw = await this.repo.getStationLiveArrivals(station.uid);
		return this.parser.parseLive(raw, station, Math.floor(Date.now() / 1000));
	}
}