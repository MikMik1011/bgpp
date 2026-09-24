<script lang="ts">
	import Combobox from '$lib/components/ui/combobox/combobox.svelte';
	import { arrivalsDialogOpen, city, selectableStations, selectedStationId } from '../../../../stores';
</script>

<div>
	<Combobox
		selectables={$selectableStations[$city?.value ?? ''] ?? []}
		bind:value={$selectedStationId}
		on:select={() => ($arrivalsDialogOpen = true)}
	/>
</div>
