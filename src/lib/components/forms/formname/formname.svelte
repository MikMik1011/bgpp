<script>
// @ts-nocheck

	import Combobox from '$lib/components/ui/combobox/combobox.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { city, selectableStations, selectedId } from '../../../../stores';
	import { get } from 'svelte/store';

	export let selected = $selectableStations[$city?.value][0];

    // Reactively update selectedId when selected changes
    $: if (selected) {
        $selectedId = selected?.value;
    }

	const emptyArr = [];
</script>

<div>
	
	<Combobox selectables={$selectableStations[$city?.value] ?? []} bind:value={$selectedId}/>
	<div class="w-full">
		<Dialog.Trigger class="w-full">
			<Button class="w-full mt-2">Kada će mi bus?</Button>
		</Dialog.Trigger>
	</div>
</div>
