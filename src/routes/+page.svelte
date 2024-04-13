<script>
	// loader
	import Loader from '$lib/loader/loader.svg';

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

	const gradovi = [
		{ value: 'bg', label: 'Beograd' },
		{ value: 'ns', label: 'Novi Sad' },
		{ value: 'ni', label: 'Niš' }
	];

	let selected;
	let loader = true;

	const linije = [
		{
			linija: '78',
			eta: '03:42',
			stanice: '3',
			trenutna: '¯\\_(ツ)_/¯',
			id: 'P81524'
		},
		{
			linija: 'E6',
			eta: '01:40',
			stanice: '0',
			trenutna: '¯\\_(ツ)_/¯',
			id: 'P30234'
		}
	];
</script>

<Dialog.Root>
	<div class="h-[90vh] flex justify-center items-center">
		<Card.Root class="relative p-5">
			<div class="absolute top-5 right-5"><ThemeToggle /></div>
			<Card.Header>
				<Card.Title>BG++</Card.Title>
				<Card.Description>fixamo fix ideje since 2023</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="mb-2">
					<Select.Root portal={null}>
						<Select.Trigger class="max-w-xs">
							<Select.Value placeholder="Izaberi grad..." />
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								{#each gradovi as grad}
									<Select.Item value={grad.value} label={grad.label}>{grad.label}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
						<Select.Input name="grad" />
					</Select.Root>
				</div>
				<Separator />
				<div class="my-2">
					<Select.Root portal={null} bind:selected>
						<Select.Trigger class="max-w-xs">
							<Select.Value placeholder="Tip pretrage..." />
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Item value="ids" label="Po ID-u">Po ID-u</Select.Item>
								<Select.Item value="ime" label="Po imenu">Po imenu</Select.Item>
								<Select.Item value="lok" label="Po lokaciji">Po lokaciji</Select.Item>
							</Select.Group>
						</Select.Content>
						<Select.Input name="tipPretrage" />
					</Select.Root>
				</div>
				{#if selected != undefined && selected.value === 'ids'}
					<FormID />
				{:else if selected != undefined && selected.value === 'ime'}
					<FormName />
				{:else if selected != undefined && selected.value === 'lok'}
					<FormLocation />
				{/if}
			</Card.Content>
			<div class="mt-4 flex gap-8">
				<div class="flex items-center gap-2">
					<Label for="usteda">Ušteda podataka:</Label>
					<Checkbox id="usteda" checked />
				</div>
				<div class="flex items-center gap-2">
					<Label for="sort">Sortiranje linija:</Label>
					<Checkbox id="sort" />
				</div>
			</div>
		</Card.Root>
	</div>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header class="relative">
			<Dialog.Title>Stanica: Futoška Bla Bla</Dialog.Title>
			<Dialog.Description>
				Poslednji put ažurirana: 12.4.2023. 00:00:00
				{#if loader}
					<img class="inline-block" src={Loader} alt="Ažuriranje podataka u toku..." />
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		<div class="flex flex-wrap">
			<div class="w-full flex justify-center" id="table">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Linija</Table.Head>
							<Table.Head class="text-right">ETA</Table.Head>
							<Table.Head class="text-right">Preostale stanice</Table.Head>
							<!--<Table.Head>Trenutna stanica</Table.Head>-->
							<Table.Head class="text-right">ID Vozila</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each linije as linija}
							<Table.Row>
								<Table.Cell class="font-medium">{linija.linija}</Table.Cell>
								<Table.Cell class="text-right">{linija.eta}</Table.Cell>
								<Table.Cell class="text-right">{linija.stanice}</Table.Cell>
								<!--<Table.Cell>{linija.trenutna}</Table.Cell>-->
								<Table.Cell class="text-right">{linija.id}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
			<div id="map"></div>
		</div>
	</Dialog.Content>
</Dialog.Root>
