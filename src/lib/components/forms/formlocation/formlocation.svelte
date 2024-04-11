<script>
	import Combobox from '$lib/components/ui/combobox/combobox.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Slider } from '$lib/components/ui/slider';
	import * as Dialog from '$lib/components/ui/dialog';
	import Label from '$lib/components/ui/label/label.svelte';

	let selectables = [
		{
			value: 'ime stanice 1',
			label: 'Ime Stanice 1'
		},
		{
			value: 'ime stanice 2',
			label: 'Ime Stanice 2'
		},
		{
			value: 'ime stanice 3',
			label: 'Ime Stanice 3'
		},
		{
			value: 'ime stanice 4',
			label: 'Ime Stanice 4'
		},
		{
			value: 'imestanice 5',
			label: 'Ime Stanice 5'
		}
	];

	let value = [700];
</script>

<div>
	<Button class="w-full">Pronađi najbliže stanice</Button>
	<div class="w-full mt-2">
		<Label>Najveća udaljenost ({value[0]}m)</Label>
		<Slider bind:value min={50} max={1000} step={50} class="mt-2 mb-4" />
	</div>
	<Combobox bind:selectables />
	<div class="w-full">
		<Dialog.Trigger class="w-full">
			<Button class="w-full mt-2">Kada će mi bus?</Button>
		</Dialog.Trigger>
	</div>
</div>
