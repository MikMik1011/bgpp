<script>
	import { Select as SelectPrimitive } from "bits-ui";
	import { scale } from "svelte/transition";
	import { cn, flyAndScale } from "$lib/utils.js";
	let className = undefined;
	export let sideOffset = 4;
	export let inTransition = flyAndScale;
	export let inTransitionConfig = undefined;
	export let outTransition = scale;
	export let outTransitionConfig = {
		start: 0.95,
		opacity: 0,
		duration: 50,
	};
	export { className as class };
</script>

<SelectPrimitive.Content
	{inTransition}
	{inTransitionConfig}
	{outTransition}
	{outTransitionConfig}
	{sideOffset}
	class={cn(
		"relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md focus:outline-none",
		className
	)}
	{...$$restProps}
>
	<div class="w-full p-1">
		<slot />
	</div>
</SelectPrimitive.Content>
