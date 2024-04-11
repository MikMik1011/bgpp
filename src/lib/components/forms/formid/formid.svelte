<script>
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
</script>

<div>
	<Input type="number" min="0" placeholder="Broj stanice" class="max-w-xs"></Input>

	<Dialog.Trigger class="w-full mt-2">
		<Button class="w-full">Kada će mi bus?</Button>
	</Dialog.Trigger>
</div>
