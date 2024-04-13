<script>
	import { Command as CommandPrimitive } from "cmdk-sv";
	import { cn } from "$lib/utils.js";
	export let value = undefined;
	let className = undefined;
	export { className as class };
</script>

<CommandPrimitive.Root
	class={cn(
		"flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
		className
	)}
	bind:value
	{...$$restProps}
>
	<slot />
</CommandPrimitive.Root>
