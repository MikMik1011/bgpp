<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	// shadcn base
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Checkbox } from '$lib/components/ui/checkbox';
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
	import { arrivalsDialogOpen, city, dataSaver, sortLines, selectedStationId } from '../stores';
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
	$: sortedRows = $sortLines
		? [...rows].sort((a, b) => {
				const numA = parseInt(a.lineNumber, 10);
				const numB = parseInt(b.lineNumber, 10);
				if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) return numA - numB;
				if (a.lineNumber !== b.lineNumber) return a.lineNumber.localeCompare(b.lineNumber);
				return a.etaSeconds - b.etaSeconds;
			})
		: [...rows].reverse();

	$: mapMarkers = arrivals
		? [
				{
					coords: arrivals.station.coords,
					color: 'yellow',
					popup: `${arrivals.station.name} (${arrivals.station.id})`
				},
				...sortedRows.map((row) => ({
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
		if (!$dataSaver) return;
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
	<div class="h-[90vh] flex justify-center items-center">
		<Card.Root class="relative p-5">
			<div class="absolute top-5 right-5"><ThemeToggle /></div>
			<Card.Header>
				<Card.Title>BG++</Card.Title>
				<Card.Description>fixamo fix ideje since 2023</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="mb-2">
					<Select.Root portal={null} bind:selected={$city}>
						<Select.Trigger class="max-w-xs">
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
				<div class="my-2">
					<Select.Root portal={null} bind:selected={searchMode}>
						<Select.Trigger class="max-w-xs">
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
			<div class="mt-4 flex gap-8">
				<div class="flex items-center gap-2">
					<Label for="usteda">Ušteda podataka:</Label>
					<Checkbox id="usteda" bind:checked={$dataSaver} />
				</div>
				<div class="flex items-center gap-2">
					<Label for="sort">Sortiranje linija:</Label>
					<Checkbox id="sort" bind:checked={$sortLines} />
				</div>
			</div>
		</Card.Root>
	</div>
	<Dialog.Content class="sm:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>
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
					<div class="text-destructive">Greška pri ažuriranju: {errorMessage}</div>
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		<div class="flex flex-col gap-4">
			<div class="w-full flex justify-center">
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
						{#each sortedRows as row}
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
				<div class="h-72 w-full overflow-hidden rounded-md border">
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
