<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import { selectedStationId } from '../../../../stores';

	let idValue = '';
	$: selectedStationId.set(idValue.trim().toUpperCase());
</script>

<div>
	<Input bind:value={idValue} placeholder="Broj stanice (npr. P81524)" class="w-full" />

	<Dialog.Trigger asChild let:builder>
		<Button builders={[builder]} class="w-full mt-2" disabled={!idValue.trim()}>
			Kada će mi bus?
		</Button>
	</Dialog.Trigger>
</div>
