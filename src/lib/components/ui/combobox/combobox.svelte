<script>
	import Check from 'svelte-radix/Check.svelte';
	import CaretSort from 'svelte-radix/CaretSort.svelte';
	import { createEventDispatcher, tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';

	export let selectables;

	const dispatch = createEventDispatcher();

	const MAX_RESULTS = 50;

	let open = false;
	export let value = '';
	let searchTerm = '';

	$: selectedValue = value
		? (selectables.find((/** @type {{ value: string; }} */ f) => f.value === value)?.label ?? 'Odabir stanice...')
		: 'Odabir stanice...';

	$: normalizedSearch = searchTerm.trim().toLowerCase();
	$: filteredSelectables = (
		normalizedSearch
			? selectables.filter((/** @type {{ label: string; }} */ f) =>
					f.label.toLowerCase().includes(normalizedSearch)
				)
			: selectables
	).slice(0, MAX_RESULTS);

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	/**
	 * @param {string} triggerId
	 */
	function closeAndFocusTrigger(triggerId) {
		open = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}
</script>

<Popover.Root bind:open let:ids>
	<Popover.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			variant="outline"
			role="combobox"
			aria-expanded={open}
			class="w-full justify-between bg-card"
		>
			{selectedValue}
			<CaretSort class="ml-2 h-4 w-4 shrink-0 opacity-50" />
		</Button>
	</Popover.Trigger>
	<Popover.Content
		class="flex w-[min(24rem,92vw)] flex-col bg-card p-0"
		fitViewport
		collisionPadding={16}
	>
		<Command.Root shouldFilter={false} class="flex min-h-0 flex-1 flex-col bg-card">
			<Command.Input bind:value={searchTerm} placeholder="Pretraži stanice..." class="shrink-0 sm:h-9" />
			<Command.List class="max-h-[40vh] sm:max-h-[300px]">
				<Command.Empty>Stanica nije pronađena.</Command.Empty>
				<Command.Group>
					{#each filteredSelectables as selectable (selectable.value)}
						<Command.Item
							value={selectable.label}
							onSelect={() => {
								value = selectable.value;
								dispatch('select', selectable.value);
								closeAndFocusTrigger(ids.trigger);
							}}
						>
							<Check class={cn('mr-2 h-4 w-4', value !== selectable.value && 'text-transparent')} />
							{selectable.label}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
