<script>
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Separator } from '$lib/components/ui/separator';
	import * as Table from '$lib/components/ui/table';

	import FormID from '$lib/components/forms/formid/formid.svelte';
	import FormName from '$lib/components/forms/formname/formname.svelte';
	import FormLocation from '$lib/components/forms/formlocation/formlocation.svelte';

	const gradovi = [
		{ value: 'bg', label: 'Beograd' },
		{ value: 'ns', label: 'Novi Sad' },
		{ value: 'ni', label: 'Niš' }
	];

	let selected;

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
		<Card.Root class="p-5">
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
		<Dialog.Header>
			<Dialog.Title>Stanica: Futoška Bla Bla</Dialog.Title>
			<Dialog.Description>
				<div>Poslednji put ažurirana: 12.4.2023. 00:00:00</div>
				<div>Ažuriranje u toku...</div>
			</Dialog.Description>
		</Dialog.Header>
		<div class="flex gap-6">
			<div id="table">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Linija</Table.Head>
							<Table.Head>ETA</Table.Head>
							<Table.Head>Preostale stanice</Table.Head>
							<Table.Head>Trenutna stanica</Table.Head>
							<Table.Head>ID Vozila</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each linije as linija}
							<Table.Row>
								<Table.Cell class="font-medium">{linija.linija}</Table.Cell>
								<Table.Cell>{linija.eta}</Table.Cell>
								<Table.Cell>{linija.stanice}</Table.Cell>
								<Table.Cell class="text-center">{linija.trenutna}</Table.Cell>
								<Table.Cell>{linija.id}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
			<div id="map"></div>
		</div>
	</Dialog.Content>
</Dialog.Root>
