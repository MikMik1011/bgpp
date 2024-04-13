<script>
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
</script>

<div>
	<Input type="number" min="0" placeholder="Broj stanice" class="max-w-xs mb-2"></Input>

	<Dialog.Trigger class="w-full">
		<Button class="w-full">Kada će mi bus?</Button>
	</Dialog.Trigger>
</div>
