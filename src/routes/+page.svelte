<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	// shadcn base
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Separator } from '$lib/components/ui/separator';

	// custom components
	import FormID from '$lib/components/forms/formid/formid.svelte';
	import FormName from '$lib/components/forms/formname/formname.svelte';
	import FormLocation from '$lib/components/forms/formlocation/formlocation.svelte';
	import ThemeToggle from '$lib/components/ui/themetoggle/themetoggle.svelte';
	import LiveMap from '$lib/components/map/livemap.svelte';

	import { getArrivals, type ArrivalsResponse } from '$lib/bgpp/client';
	import type { Arrival } from '$lib/types';
	import { formatSeconds } from '$lib/utils/format';
	import { arrivalsDialogOpen, city, selectedStationId } from '../stores';
	import type { PageData } from './$types';

	export let data: PageData;

	const searchModes = [
		{ value: 'id', label: 'ID stanice' },
		{ value: 'name', label: 'Ime stanice' },
		{ value: 'coords', label: 'Lokacija' }
	];
	let searchMode: { value: string; label: string } | undefined;

	let arrivals: ArrivalsResponse | undefined;
	let lastUpdated: Date | undefined;
	let updating = false;
	let errorMessage: string | undefined;
	let pollHandle: ReturnType<typeof setInterval> | undefined;

	type ArrivalRow = Arrival & { lineNumber: string; lineName: string };

	const flattenLines = (response: ArrivalsResponse): ArrivalRow[] =>
		response.lines.flatMap((line) =>
			line.arrivals.map((arrival) => ({
				lineNumber: line.lineNumber,
				lineName: line.lineName,
				...arrival
			}))
		);

	$: rows = arrivals ? flattenLines(arrivals) : [];

	$: mapMarkers = arrivals
		? [
				{
					coords: arrivals.station.coords,
					color: 'yellow',
					popup: `${arrivals.station.name} (${arrivals.station.id})`
				},
				...rows.map((row) => ({
					coords: row.coords,
					color: 'blue',
					label: row.lineNumber,
					popup: row.garageNo
				}))
			]
		: [];

	const stopPolling = () => {
		if (pollHandle) clearInterval(pollHandle);
		pollHandle = undefined;
	};

	const fetchArrivalsOnce = async () => {
		const cityId = $city?.value;
		const stationId = $selectedStationId;
		if (!cityId || !stationId) return;

		updating = true;
		errorMessage = undefined;
		try {
			arrivals = await getArrivals(cityId, stationId);
			lastUpdated = new Date();
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Greška pri ažuriranju podataka.';
		} finally {
			updating = false;
		}
	};

	const startPolling = () => {
		stopPolling();
		fetchArrivalsOnce();
		pollHandle = setInterval(fetchArrivalsOnce, 10_000);
	};

	$: if ($arrivalsDialogOpen) startPolling();
	else {
		stopPolling();
		arrivals = undefined;
		lastUpdated = undefined;
	}

	const handleVisibilityChange = () => {
		if (document.hidden) stopPolling();
		else if ($arrivalsDialogOpen) startPolling();
	};

	onMount(() => {
		document.addEventListener('visibilitychange', handleVisibilityChange);
		return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
	});

	onDestroy(stopPolling);
</script>

<Dialog.Root bind:open={$arrivalsDialogOpen}>
	<div class="flex min-h-[100dvh] items-center justify-center px-4 py-8">
		<Card.Root class="relative w-full max-w-md rounded-2xl shadow-lg">
			<div class="absolute top-4 right-4"><ThemeToggle /></div>
			<Card.Header>
				<Card.Title>BG++</Card.Title>
				<Card.Description>fixamo fix ideje since 2023</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="mb-4">
					<Select.Root portal={null} bind:selected={$city}>
						<Select.Trigger class="w-full">
							<Select.Value placeholder="Izaberi grad..." />
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								{#each data.cities as grad}
									<Select.Item value={grad.id} label={grad.name}>{grad.name}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
						<Select.Input name="grad" />
					</Select.Root>
				</div>
				<Separator />
				<div class="my-4">
					<Select.Root portal={null} bind:selected={searchMode}>
						<Select.Trigger class="w-full">
							<Select.Value placeholder="Tip pretrage..." />
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								{#each searchModes as mode}
									<Select.Item value={mode.value} label={mode.label}>{mode.label}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
						<Select.Input name="tipPretrage" />
					</Select.Root>
				</div>
				{#if !$city}
					<p class="text-sm text-muted-foreground">Prvo izaberi grad.</p>
				{:else if searchMode?.value === 'id'}
					<FormID />
				{:else if searchMode?.value === 'name'}
					<FormName />
				{:else if searchMode?.value === 'coords'}
					<FormLocation />
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
	<Dialog.Content
		class="inset-0 left-0 top-0 h-[100dvh] max-h-[100dvh] w-full max-w-full translate-x-0 translate-y-0 overflow-x-hidden overflow-y-auto rounded-none border-0 sm:inset-auto sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border"
	>
		<Dialog.Header class="min-w-0">
			<Dialog.Title class="break-words">
				{#if arrivals}
					Stanica: {arrivals.station.name} ({arrivals.station.id})
				{:else}
					Stanica
				{/if}
			</Dialog.Title>
			<Dialog.Description>
				{#if lastUpdated}
					<div>Poslednji put ažurirano: {lastUpdated.toLocaleTimeString()}</div>
				{/if}
				{#if updating}
					<div>Ažuriranje u toku...</div>
				{/if}
				{#if errorMessage}
					<div class="text-destructive break-words">Greška pri ažuriranju: {errorMessage}</div>
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		<div class="flex min-w-0 flex-col gap-4">
			<div class="w-full min-w-0">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Linija</Table.Head>
							<Table.Head class="text-right">ETA</Table.Head>
							<Table.Head class="text-right">Preostale stanice</Table.Head>
							<Table.Head class="text-right">ID Vozila</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each rows as row}
							<Table.Row>
								<Table.Cell class="font-medium">{row.lineNumber}</Table.Cell>
								<Table.Cell class="text-right">{formatSeconds(row.etaSeconds)}</Table.Cell>
								<Table.Cell class="text-right">{row.etaStations}</Table.Cell>
								<Table.Cell class="text-right">{row.garageNo}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
			{#if arrivals}
				<div class="aspect-square max-h-[70vh] w-full overflow-hidden rounded-md border">
					<LiveMap
						center={arrivals.station.coords}
						markers={mapMarkers}
						autoFit
						recenterKey={arrivals.station.id}
					/>
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
