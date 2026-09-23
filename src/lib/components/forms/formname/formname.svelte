<script lang="ts">
	import Combobox from '$lib/components/ui/combobox/combobox.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { city, selectableStations, selectedStationId } from '../../../../stores';
</script>

<div>
	<Combobox selectables={$selectableStations[$city?.value ?? ''] ?? []} bind:value={$selectedStationId} />

	<div class="w-full">
		<Dialog.Trigger asChild let:builder>
			<Button builders={[builder]} class="w-full mt-2" disabled={!$selectedStationId}>
				Kada će mi bus?
			</Button>
		</Dialog.Trigger>
	</div>
</div>
