<script>
	import Combobox from '$lib/components/ui/combobox/combobox.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';

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
</script>

<div>
	<Combobox bind:selectables />
	<div class="w-full">
		<Dialog.Trigger class="w-full">
			<Button class="w-full mt-2">Kada će mi bus?</Button>
		</Dialog.Trigger>
	</div>
</div>
