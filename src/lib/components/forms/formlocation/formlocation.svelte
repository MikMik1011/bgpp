<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { Slider } from '$lib/components/ui/slider';
	import Label from '$lib/components/ui/label/label.svelte';
	import LiveMap from '$lib/components/map/livemap.svelte';
	import type { Coords } from '$lib/types';
	import { arrivalsDialogOpen, city, cityStationMap, selectedStationId } from '../../../../stores';
	import { getDistanceMeters, getUserLocation } from '$lib/utils/geo';

	let maxDistance = [350];
	let userCoords: Coords | undefined;
	let searching = false;
	let errorMessage: string | undefined;

	type NearbyStation = { id: string; name: string; coords: Coords; distance: number };
	let closestStations: NearbyStation[] = [];

	const findClosest = async () => {
		errorMessage = undefined;
		searching = true;
		try {
			userCoords = await getUserLocation();
			const stations = $cityStationMap[$city?.value ?? ''] ?? [];
			closestStations = stations
				.map((station) => ({
					id: station.id,
					name: station.name,
					coords: station.coords,
					distance: Math.round(getDistanceMeters(userCoords as Coords, station.coords))
				}))
				.filter((station) => station.distance <= maxDistance[0])
				.sort((a, b) => a.distance - b.distance);
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Greška pri pronalaženju lokacije.';
		} finally {
			searching = false;
		}
	};

	$: mapMarkers = userCoords
		? [
				{ coords: userCoords, color: 'green' },
				...closestStations.map((station) => ({
					id: station.id,
					coords: station.coords,
					color: 'yellow',
					label: station.id
				}))
			]
		: [];

	const handleMarkerClick = (event: CustomEvent<string>) => {
		$selectedStationId = event.detail;
		$arrivalsDialogOpen = true;
	};
</script>

<div>
	<Button class="w-full" on:click={findClosest} disabled={searching}>
		{searching ? 'Tražim lokaciju...' : 'Pronađi najbliže stanice'}
	</Button>
	{#if errorMessage}
		<p class="mt-2 text-sm text-destructive">{errorMessage}</p>
	{/if}

	<div class="w-full mt-2">
		<Label>Najveća udaljenost ({maxDistance[0]}m)</Label>
		<Slider bind:value={maxDistance} min={50} max={1000} step={50} class="mt-2 mb-4" />
	</div>

	{#if userCoords && !$arrivalsDialogOpen}
		<div class="h-72 w-full overflow-hidden rounded-md border">
			<LiveMap
				center={userCoords}
				markers={mapMarkers}
				autoFit
				recenterKey={String(closestStations.length)}
				on:markerclick={handleMarkerClick}
			/>
		</div>
		{#if closestStations.length === 0}
			<p class="mt-2 text-sm text-muted-foreground">
				Nema stanica u ovom radijusu. Dodirni mapu ili povećaj najveću udaljenost.
			</p>
		{/if}
	{/if}
</div>
